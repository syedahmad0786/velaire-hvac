import {
  auditInvoiceAgainstReceipt,
  checkServiceFit,
  compareChangeOrder,
  compareOfferVersions,
  SERVICES,
  estimateServiceRange,
  getEvidence,
  getProjectPreflight,
  nextActionsFor,
  type BuildingType,
  type EvidenceTopic,
  type EstimateAccess,
  type InstallationLocation,
  type InvoiceLineInput,
  type InvoiceLineKind,
  type KnownFinding,
  type ProjectType,
  type ServiceCase,
  type ToolResult,
  type Urgency,
} from "./domain";
import { caseVisuals } from "./case-visuals";
import { PromiseDiffStore } from "./store";
import {
  MARKET_SERIES,
  SITE_MANIFEST,
  compareQuoteContext,
  getMarketContext,
  operationsStore,
  searchSite,
  summarizeMetrics,
  type PlanType,
  type SiteSearchScope,
} from "./operations";

export type ToolRoute = "customer" | "owner" | "operations" | "evidence" | "receipt" | "none";

export interface WebMCPStatus {
  supported: boolean;
  registered: string[];
  errors: string[];
  dispose: () => void;
}

const text = (maxLength: number) => ({ type: "string", minLength: 1, maxLength });
const stringList = (maxItems: number, maxLength = 240) => ({
  type: "array",
  maxItems,
  items: text(maxLength),
});

const CASE_ID = text(80);
const REVISION = { type: "integer", minimum: 0 };
const MONEY = { type: "integer", minimum: 0, maximum: 10_000_000 };

class InputError extends Error {}

function record(value: unknown, allowedKeys?: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Input must be an object.");
  const input = value as Record<string, unknown>;
  const extra = allowedKeys && Object.keys(input).find((key) => !allowedKeys.includes(key));
  if (extra) throw new InputError(`Unknown input property: ${extra}.`);
  return input;
}

function requiredString(input: Record<string, unknown>, key: string, max: number): string {
  const value = input[key];
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new InputError(`${key} must be between 1 and ${max} characters.`);
  }
  return value.trim();
}

function optionalString(input: Record<string, unknown>, key: string, max: number): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  return requiredString(input, key, max);
}

function integer(input: Record<string, unknown>, key: string, min = 0, max = 10_000_000): number {
  const value = input[key];
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new InputError(`${key} must be an integer from ${min} to ${max}.`);
  }
  return value as number;
}

function optionalInteger(
  input: Record<string, unknown>,
  key: string,
  min = 0,
  max = 10_000_000,
): number | undefined {
  return input[key] === undefined ? undefined : integer(input, key, min, max);
}

function strings(input: Record<string, unknown>, key: string, maxItems: number, maxLength = 240): string[] {
  const value = input[key];
  if (!Array.isArray(value) || value.length > maxItems) throw new InputError(`${key} must contain at most ${maxItems} items.`);
  return value.map((item) => {
    if (typeof item !== "string" || !item.trim() || item.trim().length > maxLength) {
      throw new InputError(`${key} contains an invalid item.`);
    }
    return item.trim();
  });
}

function invoiceLines(input: Record<string, unknown>): InvoiceLineInput[] {
  const value = input.lines;
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) {
    throw new InputError("lines must contain from 1 to 30 items.");
  }
  return value.map((item) => {
    const line = record(item, ["description", "amountCents", "kind", "authorizationRef"]);
    return {
      description: requiredString(line, "description", 240),
      amountCents: integer(line, "amountCents", 0),
      kind: oneOf<InvoiceLineKind>(line, "kind", ["accepted_offer", "approved_change", "tax_or_required_fee", "other"]),
      authorizationRef: optionalString(line, "authorizationRef", 80),
    };
  });
}

function oneOf<T extends string>(input: Record<string, unknown>, key: string, values: readonly T[]): T {
  const value = input[key];
  if (typeof value !== "string" || !values.includes(value as T)) throw new InputError(`${key} is invalid.`);
  return value as T;
}

function invalid(error: unknown): ToolResult {
  return {
    ok: false,
    code: "INVALID_STATE",
    beforeRevision: 0,
    afterRevision: 0,
    effect: error instanceof Error ? error.message : "The input was invalid.",
    didNot: ["No case state changed."],
    humanActionRequired: false,
    nextActions: ["correct_input_and_retry"],
  };
}

function readResult<T>(data: T, revision = 0, caseId?: string, nextActions: string[] = []): ToolResult<T> {
  return {
    ok: true,
    code: "OK",
    caseId,
    beforeRevision: revision,
    afterRevision: revision,
    effect: "Read authoritative Velaire page data without changing it.",
    didNot: ["No case state changed."],
    humanActionRequired: false,
    data,
    nextActions,
  };
}

function notFound(label: string): ToolResult {
  return {
    ok: false,
    code: "NOT_FOUND",
    beforeRevision: 0,
    afterRevision: 0,
    effect: `${label} was not found.`,
    didNot: ["No case state changed."],
    humanActionRequired: false,
    nextActions: [],
  };
}

function canonical(path: string): string {
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  return new URL(path, origin).toString();
}

function actorRevision(serviceCase: ServiceCase, actor: "customer" | "owner"): number {
  const related = actor === "owner"
    ? [...serviceCase.offers.map((item) => item.revision), ...serviceCase.changeOrders.map((item) => item.revision)]
    : [];
  return Math.max(0, ...related, ...serviceCase.messages.filter((item) => item.actor === actor).map((item) => item.revision));
}

function casePayload(serviceCase: ServiceCase, includeOwnerDraft = false, store?: PromiseDiffStore) {
  const { ownerDraft, ...customerSafeCase } = serviceCase;
  const session = store?.getSharedSession();
  const customerUrl = new URL(`/demo/customer?case=${encodeURIComponent(serviceCase.id)}`, canonical("/"));
  const ownerUrl = new URL(`/demo/owner?case=${encodeURIComponent(serviceCase.id)}`, canonical("/"));
  const graphUrl = new URL(`/case-graph/${encodeURIComponent(serviceCase.id)}?case=${encodeURIComponent(serviceCase.id)}`, canonical("/"));
  if (session?.caseId === serviceCase.id) {
    if (session.role === "customer") {
      customerUrl.searchParams.set("access", session.accessToken);
      graphUrl.searchParams.set("access", session.accessToken);
    } else {
      ownerUrl.searchParams.set("access", session.accessToken);
    }
  }
  return {
    ...customerSafeCase,
    ...(includeOwnerDraft && ownerDraft ? { ownerDraft } : {}),
    pendingHumanAction:
      serviceCase.status === "booking_prepared"
        ? "Customer must confirm or cancel the displayed booking terms."
        : serviceCase.status === "change_pending"
          ? "Customer must accept or reject the displayed change order."
          : includeOwnerDraft && ownerDraft
            ? "Owner has a private draft that must be sent from the owner page."
            : null,
    customerUrl: customerUrl.toString(),
    ownerUrl: store?.getOwnerInviteUrl() ?? ownerUrl.toString(),
    caseGraphUrl: graphUrl.toString(),
    nextActions: nextActionsFor(serviceCase),
  };
}

function waitForActorReply(
  store: PromiseDiffStore,
  caseId: string,
  afterRevision: number,
  maxWaitSeconds: number,
  actor: "customer" | "owner",
  signal?: AbortSignal,
): Promise<ToolResult> {
  if (store.getSharedSession()) {
    return store.waitShared(afterRevision, maxWaitSeconds, signal).then((shared) => shared ?? notFound(`Service case ${caseId}`));
  }
  const find = () => store.getSnapshot().cases.find((item) => item.id === caseId);
  const current = find();
  if (!current) return Promise.resolve(notFound(`Service case ${caseId}`));
  if (actorRevision(current, actor) > afterRevision) {
    return Promise.resolve(readResult(casePayload(current, actor === "customer", store), current.revision, current.id, nextActionsFor(current)));
  }

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => {};
    const finish = (value: ToolResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      signal?.removeEventListener("abort", onAbort);
      resolve(value);
    };
    const onAbort = () => {
      const latest = find();
      finish({
        ok: false,
        code: "WAIT_EXPIRED",
        caseId,
        beforeRevision: latest?.revision ?? afterRevision,
        afterRevision: latest?.revision ?? afterRevision,
        effect: "The browser cancelled the wait. The service case remains recoverable.",
        didNot: ["No case state changed."],
        humanActionRequired: false,
        nextActions: ["get_service_case"],
      });
    };
    const timer = setTimeout(() => {
      const latest = find();
      finish({
        ok: false,
        code: "STILL_WAITING",
        caseId,
        beforeRevision: latest?.revision ?? afterRevision,
        afterRevision: latest?.revision ?? afterRevision,
        effect: `No newer ${actor} event arrived within ${maxWaitSeconds} seconds.`,
        didNot: ["No case state changed.", "ChatGPT was not subscribed after the tool call ended."],
        humanActionRequired: false,
        data: latest ? { serviceCase: casePayload(latest, actor === "customer", store), cursor: latest.revision, nextPollAfterMs: 750, maximumCooperativeWaitSeconds: 120 } : undefined,
        nextActions: [`Call the ${actor === "owner" ? "velaire_wait_for_owner_reply" : "velaire_wait_for_customer_reply"} tool again with the returned cursor, until 120 seconds total or the user stops.`],
      });
    }, Math.max(1, Math.min(15, maxWaitSeconds)) * 1000);

    unsubscribe = store.subscribe(() => {
      const latest = find();
      if (latest && actorRevision(latest, actor) > afterRevision) {
        finish(readResult(casePayload(latest, actor === "customer", store), latest.revision, latest.id, nextActionsFor(latest)));
      }
    });
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

export function waitForOwnerReply(
  store: PromiseDiffStore,
  caseId: string,
  afterRevision: number,
  maxWaitSeconds: number,
  signal?: AbortSignal,
): Promise<ToolResult> {
  return waitForActorReply(store, caseId, afterRevision, maxWaitSeconds, "owner", signal);
}

export function waitForCustomerReply(
  store: PromiseDiffStore,
  caseId: string,
  afterRevision: number,
  maxWaitSeconds: number,
  signal?: AbortSignal,
): Promise<ToolResult> {
  return waitForActorReply(store, caseId, afterRevision, maxWaitSeconds, "customer", signal);
}

type ToolDefinition = WebMCPTool;

function commonTools(route: ToolRoute): ToolDefinition[] {
  const serviceIdSchema = { type: "string", enum: ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] };
  return [
    {
      name: "velaire_get_site_manifest",
      title: "Get site manifest",
      description: "Returns Velaire's identity, canonical routes, service area, WebMCP capability groups, and trust boundaries. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          record(value, []);
          return readResult({ ...SITE_MANIFEST, routes: SITE_MANIFEST.routes.map((item) => ({ ...item, url: canonical(item.path) })) });
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_search_site",
      title: "Search this website",
      description: "Searches Velaire services, policy evidence, and agent-help records and returns canonical page URLs. Read-only; it does not search the wider web.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["query"],
        properties: { query: text(160), scope: { type: "string", enum: ["all", "services", "policies", "help"] } },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["query", "scope"]);
          const scope = input.scope === undefined ? "all" : oneOf<SiteSearchScope>(input, "scope", ["all", "services", "policies", "help"]);
          const results = searchSite(requiredString(input, "query", 160), scope).map((item) => ({ ...item, url: canonical(item.path) }));
          return readResult({ query: input.query, scope, count: results.length, results });
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_list_services",
      title: "List HVAC services",
      description: "Lists every published Velaire demo service with its synthetic price band, eligibility, required details, and canonical evidence URL. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          record(value, []);
          return readResult(SERVICES.map((service) => ({ ...service, canonicalUrl: canonical(service.canonicalPath), syntheticPricing: true })));
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_service_details",
      title: "Get HVAC service details",
      description: "Returns one published service definition, synthetic planning range, required inputs, and source URL. Read-only; it is not a diagnosis or quote.",
      inputSchema: { type: "object", additionalProperties: false, required: ["serviceId"], properties: { serviceId: serviceIdSchema } },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["serviceId"]);
          const serviceId = oneOf(input, "serviceId", ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] as const);
          const service = SERVICES.find((item) => item.id === serviceId);
          return service ? readResult({ ...service, canonicalUrl: canonical(service.canonicalPath), syntheticPricing: true }) : notFound(`Service ${serviceId}`);
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_check_service_area",
      title: "Check service area",
      description: "Checks a postcode against Velaire's fictional published Chicago service area. Read-only; it does not check a precise address or promise travel availability.",
      inputSchema: { type: "object", additionalProperties: false, required: ["postcode"], properties: { postcode: text(12) } },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["postcode"]);
          const postcode = requiredString(input, "postcode", 12);
          const served = SITE_MANIFEST.serviceArea.includes(postcode as (typeof SITE_MANIFEST.serviceArea)[number]);
          return readResult({ postcode, status: served ? "served" : "outside_demo_area", publishedPostcodes: SITE_MANIFEST.serviceArea, requestUrl: canonical("/demo/customer?judge=1"), limitation: "Postcode fit is not a promised appointment or address-level determination." });
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_policies",
      title: "Get service policies",
      description: "Returns one or all canonical pricing, availability, cancellation, and warranty policy cards with freshness and synthetic status. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, properties: { topic: { type: "string", enum: ["pricing", "availability", "cancellation", "warranty"] } } },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["topic"]);
          const topics: EvidenceTopic[] = input.topic === undefined ? ["pricing", "availability", "cancellation", "warranty"] : [oneOf<EvidenceTopic>(input, "topic", ["pricing", "availability", "cancellation", "warranty"])];
          return readResult(getEvidence(topics).map((item) => ({ ...item, sourceUrl: canonical(item.canonicalPath) })));
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_contact_options",
      title: "Get contact and escalation options",
      description: "Returns safe, canonical ways to request service, review a case, reach the owner demo desk, or respond to an HVAC emergency. Read-only; no real phone, email, or messaging account is exposed.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          record(value, []);
          return readResult({
            serviceRequest: { label: "Open customer service room", url: canonical("/demo/customer?judge=1") },
            ownerEscalation: { label: "Open fictional owner desk", url: canonical("/demo/owner"), limitation: "Demo route only; not production authentication or a real message channel." },
            emergency: { trigger: "Gas smell, smoke, fire, sparks, or carbon-monoxide warning", action: "Leave the affected area and contact local emergency services or the utility emergency line. Do not use the ordinary booking flow." },
          });
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_agent_help",
      title: "Get agent workflow help",
      description: "Returns the safe WebMCP tool sequence and human boundary for a discovery, request, negotiation, booking, project-planning, or invoice-audit task. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, required: ["task"], properties: { task: { type: "string", enum: ["discover", "request", "negotiate", "book", "project", "audit"] } } },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["task"]);
          const task = oneOf(input, "task", ["discover", "request", "negotiate", "book", "project", "audit"] as const);
          const workflows = {
            discover: ["velaire_search_site", "velaire_list_services", "velaire_get_service_details", "velaire_get_policies"],
            request: ["velaire_check_service_fit", "velaire_estimate_service_range", "velaire_open_service_case", "velaire_get_service_case"],
            negotiate: ["velaire_get_service_case", "velaire_compare_offer_versions", "velaire_submit_case_message", "velaire_wait_for_owner_reply"],
            book: ["velaire_get_service_case", "velaire_prepare_booking", "human_confirm_on_page", "velaire_get_booking_receipt"],
            project: ["velaire_get_market_price_context", "velaire_compare_quote_context", "velaire_prepare_project_plan", "velaire_get_project_plan"],
            audit: ["velaire_get_booking_receipt", "velaire_compare_change_order", "velaire_audit_invoice_against_receipt"],
          };
          return readResult({ task, sequence: workflows[task], operationsUrl: canonical("/demo/operations"), humanBoundary: "The agent cannot send an owner commitment, confirm a booking, approve changed work, or make payment." });
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_market_price_context",
      title: "Get HVAC market cost context",
      description: "Returns a dated 3–8 month BLS/FRED national nonresidential HVAC-contractor price index with underlying chart values and source URLs. Read-only; it is not a local residential quote or price-fairness score.",
      inputSchema: { type: "object", additionalProperties: false, properties: { months: { type: "integer", minimum: 3, maximum: 8 } } },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["months"]);
          return readResult({ ...getMarketContext(optionalInteger(input, "months", 3, 8) ?? 8), chartUrl: canonical("/demo/operations#market") });
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_compare_quote_context",
      title: "Compare quote with published context",
      description: "Compares a quote only with Velaire's fictional published service band and attaches the separate national BLS/FRED directional signal. Read-only; it does not determine fair value, diagnose work, or recommend approval.",
      inputSchema: { type: "object", additionalProperties: false, required: ["serviceId", "quoteCents"], properties: { serviceId: serviceIdSchema, quoteCents: { ...MONEY, minimum: 1 } } },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["serviceId", "quoteCents"]);
          const comparison = compareQuoteContext(oneOf(input, "serviceId", ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] as const), integer(input, "quoteCents", 1));
          return comparison ? readResult({ ...comparison, chartUrl: canonical("/demo/operations#market") }) : notFound("Service rate card");
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_prepare_project_plan",
      title: "Prepare service project plan",
      description: "Creates a browser-local 3–10 day planning draft and visible timeline/Kanban board at an exact plan revision. It does not promise dates, assign a real crew, order equipment, schedule an inspection, or approve work.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["projectType", "startDate", "durationDays", "expectedRevision"],
        properties: {
          projectType: { type: "string", enum: ["diagnostic", "repair", "equipment_replacement", "heat_pump_upgrade"] },
          startDate: { type: "string", format: "date" }, durationDays: { type: "integer", minimum: 3, maximum: 10 }, expectedRevision: REVISION,
        },
      },
      execute: (value) => {
        try {
          const input = record(value, ["projectType", "startDate", "durationDays", "expectedRevision"]);
          const before = operationsStore.getSnapshot().plan.revision;
          const outcome = operationsStore.preparePlan({
            projectType: oneOf<PlanType>(input, "projectType", ["diagnostic", "repair", "equipment_replacement", "heat_pump_upgrade"]),
            startDate: requiredString(input, "startDate", 10), durationDays: integer(input, "durationDays", 3, 10), expectedRevision: integer(input, "expectedRevision", 0),
          });
          return outcome.ok ? {
            ...readResult({ ...outcome.plan, planUrl: canonical("/demo/operations#project") }, outcome.plan.revision),
            beforeRevision: before,
            effect: `Prepared visible project-plan revision ${outcome.plan.revision}.`,
            didNot: ["No appointment, crew, equipment, inspection, payment, or completion date was committed."],
          } : {
            ok: false, code: "STALE_REVISION", beforeRevision: before, afterRevision: before,
            effect: outcome.error ?? "The plan changed.", didNot: ["No planning state changed."], humanActionRequired: false,
            data: outcome.plan, nextActions: ["get_project_plan"],
          };
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_project_plan",
      title: "Get service project plan",
      description: "Returns the current browser-local planning draft, task dependencies, proof requirements, underlying timeline data, and canonical board URL. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          record(value, []);
          const plan = operationsStore.getSnapshot().plan;
          return readResult({ ...plan, planUrl: canonical("/demo/operations#project") }, plan.revision);
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_webmcp_health",
      title: "Get WebMCP health",
      description: "Returns privacy-safe browser-local WebMCP call counts, result codes, read/action split, average latency, p95 latency, and recent calls. Read-only; inputs and outputs are never logged, and the current health call appears only after it returns.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          record(value, []);
          return readResult({ route, ...summarizeMetrics(operationsStore.getSnapshot().metrics), dashboardUrl: canonical("/demo/operations#observability"), marketSeriesId: MARKET_SERIES.seriesId });
        } catch (error) { return invalid(error); }
      },
    },
  ];
}

function customerTools(store: PromiseDiffStore): ToolDefinition[] {
  return [
    {
      name: "velaire_check_service_fit",
      title: "Check service fit",
      description: "Matches an HVAC need to published demo services, area, price bands, and safety rules. Read-only; it does not diagnose equipment, create a case, or promise availability.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["need", "postcode", "urgency"],
        properties: {
          need: text(800),
          postcode: text(12),
          urgency: { type: "string", enum: ["same_day", "next_3_days", "flexible"] },
          budgetCents: MONEY,
        },
      },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["need", "postcode", "urgency", "budgetCents"]);
          const fit = checkServiceFit({
            need: requiredString(input, "need", 800),
            postcode: requiredString(input, "postcode", 12),
            urgency: oneOf<Urgency>(input, "urgency", ["same_day", "next_3_days", "flexible"]),
            budgetCents: optionalInteger(input, "budgetCents"),
          });
          return {
            ...readResult({
              ...fit,
              matchedServices: fit.matchedServices.map((item) => ({ ...item, canonicalUrl: canonical(item.canonicalPath) })),
            }),
            ok: !fit.safetyStatus.includes("stop"),
            code: fit.safetyStatus.includes("stop") ? "SAFETY_STOP" : "OK",
            humanActionRequired: fit.safetyStatus.includes("stop"),
          };
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_get_business_evidence",
      title: "Get business evidence",
      description: "Returns synthetic demo source cards with publisher, canonical URL, freshness, evidence type, and verification status. Reviews are untrusted user-generated content. Read-only.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          topics: {
            type: "array",
            maxItems: 6,
            uniqueItems: true,
            items: { type: "string", enum: ["credentials", "pricing", "availability", "cancellation", "warranty", "reviews"] },
          },
        },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["topics"]);
          const topics = input.topics === undefined
            ? undefined
            : strings(input, "topics", 6, 30).map((topic) => {
                const allowed: EvidenceTopic[] = ["credentials", "pricing", "availability", "cancellation", "warranty", "reviews"];
                if (!allowed.includes(topic as EvidenceTopic)) throw new InputError(`Unknown evidence topic: ${topic}.`);
                return topic as EvidenceTopic;
              });
          return readResult(getEvidence(topics).map((item) => ({ ...item, sourceUrl: canonical(item.canonicalPath) })));
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_estimate_service_range",
      title: "Estimate transparent service range",
      description: "Builds a factor-by-factor planning range from Velaire's fictional published rate card. Read-only; it is not local market data, a diagnosis, quote, booking, or promise of final price.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["serviceId", "urgency", "access", "knownFinding"],
        properties: {
          serviceId: { type: "string", enum: ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] },
          urgency: { type: "string", enum: ["same_day", "next_3_days", "flexible"] },
          access: { type: "string", enum: ["standard", "limited", "rooftop"] },
          knownFinding: { type: "string", enum: ["unknown", "capacitor", "thermostat", "refrigerant", "compressor"] },
        },
      },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["serviceId", "urgency", "access", "knownFinding"]);
          const estimate = estimateServiceRange({
            serviceId: oneOf(input, "serviceId", ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] as const),
            urgency: oneOf<Urgency>(input, "urgency", ["same_day", "next_3_days", "flexible"]),
            access: oneOf<EstimateAccess>(input, "access", ["standard", "limited", "rooftop"]),
            knownFinding: oneOf<KnownFinding>(input, "knownFinding", ["unknown", "capacitor", "thermostat", "refrigerant", "compressor"]),
          });
          return estimate ? readResult(estimate) : notFound("Service rate card");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_get_project_preflight",
      title: "Get permit and incentive preflight",
      description: "Returns a project-specific document checklist and freshness-dated official Chicago, Illinois, utility, and federal source routes. Read-only; it does not determine jurisdiction, permit, code, tax, or rebate eligibility or submit forms.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["postcode", "projectType", "buildingType", "installationLocation"],
        properties: {
          postcode: text(12),
          projectType: { type: "string", enum: ["diagnostic", "repair", "equipment_replacement", "heat_pump_upgrade"] },
          buildingType: { type: "string", enum: ["single_family", "multifamily", "commercial"] },
          installationLocation: { type: "string", enum: ["indoor", "outdoor_ground", "rooftop"] },
        },
      },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value, ["postcode", "projectType", "buildingType", "installationLocation"]);
          return readResult(getProjectPreflight({
            postcode: requiredString(input, "postcode", 12),
            projectType: oneOf<ProjectType>(input, "projectType", ["diagnostic", "repair", "equipment_replacement", "heat_pump_upgrade"]),
            buildingType: oneOf<BuildingType>(input, "buildingType", ["single_family", "multifamily", "commercial"]),
            installationLocation: oneOf<InstallationLocation>(input, "installationLocation", ["indoor", "outdoor_ground", "rooftop"]),
          }));
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_open_service_case",
      title: "Open service case",
      description: "Creates a durable synthetic HVAC service case and returns separate private customer and owner capability URLs for two-chat testing. It never books, charges, or collects phone, email, or payment details. A location is stored only when explicit customer confirmation is true.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["serviceId", "problemSummary", "postcode", "urgency", "preferredWindows", "constraints"],
        properties: {
          serviceId: { type: "string", enum: ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] },
          problemSummary: text(800),
          postcode: text(12),
          urgency: { type: "string", enum: ["same_day", "next_3_days", "flexible"] },
          budgetCents: MONEY,
          preferredWindows: stringList(4, 120),
          constraints: stringList(8, 240),
          serviceLocation: text(240),
          locationPrecision: { type: "string", enum: ["area", "address"] },
          locationConsentConfirmed: { type: "boolean" },
        },
      },
      execute: async (value) => {
        try {
          const input = record(value, ["serviceId", "problemSummary", "postcode", "urgency", "budgetCents", "preferredWindows", "constraints", "serviceLocation", "locationPrecision", "locationConsentConfirmed"]);
          const serviceLocation = optionalString(input, "serviceLocation", 240);
          return await store.dispatchShared({
            type: "OPEN_CASE",
            serviceId: oneOf(input, "serviceId", ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] as const),
            problemSummary: requiredString(input, "problemSummary", 800),
            postcode: requiredString(input, "postcode", 12),
            urgency: oneOf<Urgency>(input, "urgency", ["same_day", "next_3_days", "flexible"]),
            budgetCents: optionalInteger(input, "budgetCents"),
            preferredWindows: strings(input, "preferredWindows", 4, 120),
            constraints: strings(input, "constraints", 8, 240),
            serviceLocation,
            locationPrecision: input.locationPrecision === undefined ? undefined : oneOf(input, "locationPrecision", ["area", "address"] as const),
            locationConsentConfirmed: serviceLocation ? input.locationConsentConfirmed === true : undefined,
          }, "velaire_open_service_case", "customer_agent");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_get_service_case",
      title: "Get service case",
      description: "Reads the authoritative service case, revision, messages, offers, pending human action, booking, and change orders. It changes nothing.",
      inputSchema: { type: "object", additionalProperties: false, required: ["caseId"], properties: { caseId: CASE_ID } },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId"]);
          const caseId = requiredString(input, "caseId", 80);
          await store.refreshShared();
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          return serviceCase
            ? readResult(casePayload(serviceCase, false, store), serviceCase.revision, serviceCase.id, nextActionsFor(serviceCase))
            : notFound(`Service case ${caseId}`);
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_set_service_location",
      title: "Set customer-confirmed service location",
      description: "Stores bounded customer-supplied location text on the shared case only when consentConfirmed is true. It returns map-search links but does not geocode, verify coordinates, promise travel, or collect contact/payment data.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["caseId", "expectedRevision", "serviceLocation", "precision", "consentConfirmed"],
        properties: {
          caseId: CASE_ID,
          expectedRevision: REVISION,
          serviceLocation: text(240),
          precision: { type: "string", enum: ["area", "address"] },
          consentConfirmed: { type: "boolean", const: true },
        },
      },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "expectedRevision", "serviceLocation", "precision", "consentConfirmed"]);
          if (input.consentConfirmed !== true) throw new InputError("consentConfirmed must be true.");
          const outcome = await store.dispatchShared({
            type: "SET_SERVICE_LOCATION",
            caseId: requiredString(input, "caseId", 80),
            expectedRevision: integer(input, "expectedRevision"),
            serviceLocation: requiredString(input, "serviceLocation", 240),
            precision: oneOf(input, "precision", ["area", "address"] as const),
            consentConfirmed: true,
          }, "velaire_set_service_location", "customer_agent");
          const serviceCase = outcome.caseId ? store.getSnapshot().cases.find((item) => item.id === outcome.caseId) : undefined;
          return serviceCase ? { ...outcome, data: caseVisuals(serviceCase, window.location.origin, store.getSharedSession()?.accessToken).location } : outcome;
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_get_case_visuals",
      title: "Get case graph and map links",
      description: "Returns a chat-ready structured event graph, Mermaid flowchart, exact case/revision totals, canonical visual-page URL, and Google Maps/OpenStreetMap search links. Read-only; location text is customer-supplied and not geocoded or verified.",
      inputSchema: { type: "object", additionalProperties: false, required: ["caseId"], properties: { caseId: CASE_ID } },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId"]);
          const caseId = requiredString(input, "caseId", 80);
          await store.refreshShared();
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          if (!serviceCase) return notFound(`Service case ${caseId}`);
          return readResult(caseVisuals(serviceCase, window.location.origin, store.getSharedSession()?.accessToken), serviceCase.revision, caseId, nextActionsFor(serviceCase));
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_wait_for_owner_reply",
      title: "Wait for owner reply",
      description: "Waits up to 15 seconds for a newer owner message, sent offer, or sent change order. If STILL_WAITING is returned, call it again with the returned cursor for a cooperative wait of at most 120 seconds total. It observes browser cancellation and never changes the case; the host may still end any call.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["caseId", "afterRevision"],
        properties: { caseId: CASE_ID, afterRevision: REVISION, maxWaitSeconds: { type: "integer", minimum: 1, maximum: 15 } },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (value, options) => {
        try {
          const input = record(value, ["caseId", "afterRevision", "maxWaitSeconds"]);
          return waitForOwnerReply(
            store,
            requiredString(input, "caseId", 80),
            integer(input, "afterRevision", 0),
            optionalInteger(input, "maxWaitSeconds", 1, 15) ?? 10,
            options.signal,
          );
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_submit_case_message",
      title: "Submit case message",
      description: "Adds a bounded customer question or counteroffer at an exact case revision. It does not accept an offer, book work, or send payment.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["caseId", "expectedRevision", "kind", "text"],
        properties: {
          caseId: CASE_ID,
          expectedRevision: REVISION,
          kind: { type: "string", enum: ["question", "counter"] },
          text: text(1000),
          proposedBudgetCents: MONEY,
          preferredWindow: text(160),
        },
      },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "expectedRevision", "kind", "text", "proposedBudgetCents", "preferredWindow"]);
          const outcome = await store.dispatchShared({
            type: "CUSTOMER_MESSAGE",
            caseId: requiredString(input, "caseId", 80),
            expectedRevision: integer(input, "expectedRevision", 0),
            kind: oneOf(input, "kind", ["question", "counter"] as const),
            text: requiredString(input, "text", 1000),
            proposedBudgetCents: optionalInteger(input, "proposedBudgetCents"),
            preferredWindow: optionalString(input, "preferredWindow", 160),
          }, "velaire_submit_case_message", "customer_agent");
          const serviceCase = outcome.caseId ? store.getSnapshot().cases.find((item) => item.id === outcome.caseId) : undefined;
          return serviceCase && outcome.data ? { ...outcome, data: casePayload(serviceCase, false, store) } : outcome;
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_compare_offer_versions",
      title: "Compare offer versions",
      description: "Deterministically compares two sent offers across price, deposit, schedule, scope, exclusions, warranty, and expiry. It changes nothing.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "fromVersion", "toVersion"],
        properties: { caseId: CASE_ID, fromVersion: { type: "integer", minimum: 1 }, toVersion: { type: "integer", minimum: 1 } },
      },
      annotations: { readOnlyHint: true },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "fromVersion", "toVersion"]);
          const caseId = requiredString(input, "caseId", 80);
          await store.refreshShared();
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          if (!serviceCase) return notFound(`Service case ${caseId}`);
          const comparison = compareOfferVersions(serviceCase, integer(input, "fromVersion", 1), integer(input, "toVersion", 1));
          return comparison ? readResult(comparison, serviceCase.revision, caseId) : notFound("One or both offer versions");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_prepare_booking",
      title: "Prepare booking",
      description: "Stages the latest exact sent offer for visible customer confirmation. It cannot confirm the booking or take a deposit; only the human customer can commit it in the page.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "expectedRevision", "offerVersion"],
        properties: { caseId: CASE_ID, expectedRevision: REVISION, offerVersion: { type: "integer", minimum: 1 } },
      },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "expectedRevision", "offerVersion"]);
          return await store.dispatchShared({
            type: "PREPARE_BOOKING",
            caseId: requiredString(input, "caseId", 80),
            expectedRevision: integer(input, "expectedRevision", 0),
            offerVersion: integer(input, "offerVersion", 1),
          }, "velaire_prepare_booking", "customer_agent");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_get_booking_receipt",
      title: "Get booking receipt",
      description: "Returns the immutable accepted-offer snapshot and recorded change-order decisions for a simulated booking. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, required: ["receiptId"], properties: { receiptId: text(80) } },
      annotations: { readOnlyHint: true },
      execute: async (value) => {
        try {
          const input = record(value, ["receiptId"]);
          const receiptId = requiredString(input, "receiptId", 80);
          await store.refreshShared();
          const serviceCase = store.getSnapshot().cases.find((item) => item.receipt?.id === receiptId);
          if (!serviceCase?.receipt) return notFound(`Receipt ${receiptId}`);
          const receiptUrl = new URL(`/receipt/${encodeURIComponent(receiptId)}?case=${encodeURIComponent(serviceCase.id)}`, canonical("/"));
          const session = store.getSharedSession();
          if (session?.role === "customer" && session.caseId === serviceCase.id) receiptUrl.searchParams.set("access", session.accessToken);
          return readResult({ ...serviceCase.receipt, receiptUrl: receiptUrl.toString() }, serviceCase.revision, serviceCase.id);
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_compare_change_order",
      title: "Compare change order",
      description: "Compares a sent change order with the immutable accepted booking snapshot, including price and scope. It does not judge, accept, reject, or pay the charge.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "changeOrderId"],
        properties: { caseId: CASE_ID, changeOrderId: text(80) },
      },
      annotations: { readOnlyHint: true },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "changeOrderId"]);
          const caseId = requiredString(input, "caseId", 80);
          await store.refreshShared();
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          if (!serviceCase) return notFound(`Service case ${caseId}`);
          const comparison = compareChangeOrder(serviceCase, requiredString(input, "changeOrderId", 80));
          return comparison ? readResult(comparison, serviceCase.revision, caseId) : notFound("Change order or booking receipt");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_audit_invoice_against_receipt",
      title: "Audit invoice against approved terms",
      description: "Traces each bounded invoice line to the immutable accepted offer or a human-approved change order and flags mismatches. Read-only; it does not accuse fraud, decide tax validity, dispute a charge, pay, refund, or modify the case.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["receiptId", "lines"],
        properties: {
          receiptId: text(80),
          lines: {
            type: "array",
            minItems: 1,
            maxItems: 30,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["description", "amountCents", "kind"],
              properties: {
                description: text(240),
                amountCents: MONEY,
                kind: { type: "string", enum: ["accepted_offer", "approved_change", "tax_or_required_fee", "other"] },
                authorizationRef: text(80),
              },
            },
          },
        },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (value) => {
        try {
          const input = record(value, ["receiptId", "lines"]);
          const receiptId = requiredString(input, "receiptId", 80);
          await store.refreshShared();
          const serviceCase = store.getSnapshot().cases.find((item) => item.receipt?.id === receiptId);
          if (!serviceCase) return notFound(`Receipt ${receiptId}`);
          const audit = auditInvoiceAgainstReceipt(serviceCase, invoiceLines(input));
          return audit ? readResult(audit, serviceCase.revision, serviceCase.id) : notFound(`Receipt ${receiptId}`);
        } catch (error) {
          return invalid(error);
        }
      },
    },
  ];
}

function ownerTools(store: PromiseDiffStore): ToolDefinition[] {
  return [
    {
      name: "velaire_list_service_cases",
      title: "List service cases",
      description: "Lists the synthetic service-case queue with revision, status, summary, and owner deep link. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (value) => {
        try {
          record(value, []);
          await store.refreshShared();
          return readResult(store.getSnapshot().cases.map((item) => ({
            id: item.id, status: item.status, revision: item.revision, problemSummary: item.problemSummary,
            postcode: item.postcode, ownerUrl: casePayload(item, true, store).ownerUrl,
          })));
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_get_owner_case",
      title: "Get owner case",
      description: "Reads one authoritative service case for owner review. It changes and sends nothing.",
      inputSchema: { type: "object", additionalProperties: false, required: ["caseId"], properties: { caseId: CASE_ID } },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId"]);
          const caseId = requiredString(input, "caseId", 80);
          await store.refreshShared();
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          return serviceCase ? readResult(casePayload(serviceCase, true, store), serviceCase.revision, caseId) : notFound(`Service case ${caseId}`);
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_wait_for_customer_reply",
      title: "Wait for customer reply",
      description: "Waits up to 15 seconds for a newer customer message or decision. If STILL_WAITING is returned, call it again with the returned cursor for a cooperative wait of at most 120 seconds total. It never changes or sends the case; the host may still end any call.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["caseId", "afterRevision"],
        properties: { caseId: CASE_ID, afterRevision: REVISION, maxWaitSeconds: { type: "integer", minimum: 1, maximum: 15 } },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (value, options) => {
        try {
          const input = record(value, ["caseId", "afterRevision", "maxWaitSeconds"]);
          return waitForCustomerReply(
            store,
            requiredString(input, "caseId", 80),
            integer(input, "afterRevision", 0),
            optionalInteger(input, "maxWaitSeconds", 1, 15) ?? 10,
            options.signal,
          );
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "velaire_stage_owner_reply",
      title: "Stage owner reply",
      description: "Creates a private owner reply draft at an exact revision. The customer cannot see it and the agent cannot send it; the human owner must press Send.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "expectedRevision", "text"],
        properties: { caseId: CASE_ID, expectedRevision: REVISION, text: text(1000) },
      },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "expectedRevision", "text"]);
          return await store.dispatchShared({ type: "STAGE_OWNER_REPLY", caseId: requiredString(input, "caseId", 80), expectedRevision: integer(input, "expectedRevision"), text: requiredString(input, "text", 1000) }, "velaire_stage_owner_reply", "owner_agent");
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_stage_service_offer",
      title: "Stage service offer",
      description: "Creates a private structured offer draft with exact terms. It does not send, accept, book, or charge; the human owner must review and send it.",
      inputSchema: {
        type: "object", additionalProperties: false,
        required: ["caseId", "expectedRevision", "totalCents", "arrivalWindow", "includedScope", "exclusions", "depositCents", "warrantyDays", "expiresAt"],
        properties: {
          caseId: CASE_ID, expectedRevision: REVISION, totalCents: { ...MONEY, minimum: 1 }, arrivalWindow: text(160),
          includedScope: stringList(10), exclusions: stringList(10), depositCents: MONEY,
          warrantyDays: { type: "integer", minimum: 0, maximum: 3650 }, expiresAt: { type: "string", format: "date-time" },
        },
      },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "expectedRevision", "totalCents", "arrivalWindow", "includedScope", "exclusions", "depositCents", "warrantyDays", "expiresAt"]);
          return await store.dispatchShared({
            type: "STAGE_OFFER", caseId: requiredString(input, "caseId", 80), expectedRevision: integer(input, "expectedRevision"),
            totalCents: integer(input, "totalCents", 1), arrivalWindow: requiredString(input, "arrivalWindow", 160),
            includedScope: strings(input, "includedScope", 10), exclusions: strings(input, "exclusions", 10),
            depositCents: integer(input, "depositCents"), warrantyDays: integer(input, "warrantyDays", 0, 3650),
            expiresAt: requiredString(input, "expiresAt", 80),
          }, "velaire_stage_service_offer", "owner_agent");
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "velaire_stage_change_order",
      title: "Stage change order",
      description: "Creates a private structured change-order draft against a booked case. It does not send the change or alter accepted terms; the human owner must review and send it.",
      inputSchema: {
        type: "object", additionalProperties: false,
        required: ["caseId", "expectedRevision", "reason", "addedScope", "removedScope", "deltaCents", "scheduleImpact"],
        properties: {
          caseId: CASE_ID, expectedRevision: REVISION, reason: text(600), addedScope: stringList(10),
          removedScope: stringList(10), deltaCents: { ...MONEY, minimum: 1 }, scheduleImpact: text(240),
        },
      },
      execute: async (value) => {
        try {
          const input = record(value, ["caseId", "expectedRevision", "reason", "addedScope", "removedScope", "deltaCents", "scheduleImpact"]);
          return await store.dispatchShared({
            type: "STAGE_CHANGE_ORDER", caseId: requiredString(input, "caseId", 80), expectedRevision: integer(input, "expectedRevision"),
            reason: requiredString(input, "reason", 600), addedScope: strings(input, "addedScope", 10),
            removedScope: strings(input, "removedScope", 10), deltaCents: integer(input, "deltaCents", 1),
            scheduleImpact: requiredString(input, "scheduleImpact", 240),
          }, "velaire_stage_change_order", "owner_agent");
        } catch (error) { return invalid(error); }
      },
    },
  ];
}

function evidenceTool(): ToolDefinition[] {
  return [{
    name: "velaire_get_evidence_source",
    title: "Get evidence source",
    description: "Returns the synthetic source card displayed on this canonical evidence page. Read-only and not independently verified.",
    inputSchema: { type: "object", additionalProperties: false, required: ["sourceId"], properties: { sourceId: text(80) } },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: (value) => {
      try {
        const input = record(value, ["sourceId"]);
        const sourceId = requiredString(input, "sourceId", 80);
        const source = getEvidence().find((item) => item.id === sourceId);
        return source ? readResult({ ...source, sourceUrl: canonical(source.canonicalPath) }) : notFound(`Evidence source ${sourceId}`);
      } catch (error) { return invalid(error); }
    },
  }];
}

function receiptTool(store: PromiseDiffStore): ToolDefinition[] {
  return [{
    name: "velaire_get_receipt_snapshot",
    title: "Get receipt snapshot",
    description: "Returns the immutable accepted-offer snapshot shown on this simulated receipt page. Read-only; it does not represent a real payment or appointment.",
    inputSchema: { type: "object", additionalProperties: false, required: ["receiptId"], properties: { receiptId: text(80) } },
    annotations: { readOnlyHint: true },
    execute: async (value) => {
      try {
        const input = record(value, ["receiptId"]);
        const receiptId = requiredString(input, "receiptId", 80);
        await store.refreshShared();
        const serviceCase = store.getSnapshot().cases.find((item) => item.receipt?.id === receiptId);
        return serviceCase?.receipt ? readResult(serviceCase.receipt, serviceCase.revision, serviceCase.id) : notFound(`Receipt ${receiptId}`);
      } catch (error) { return invalid(error); }
    },
  }];
}

export async function installWebMCP(store: PromiseDiffStore, route: ToolRoute): Promise<WebMCPStatus> {
  const controller = new AbortController();
  const status: WebMCPStatus = { supported: false, registered: [], errors: [], dispose: () => controller.abort() };
  const modelContext = document.modelContext;
  if (window.top !== window || !modelContext?.registerTool) return status;
  status.supported = true;
  const shared = route === "customer" || route === "owner" || route === "operations" ? commonTools(route) : [];
  const tools = route === "customer" ? [...shared, ...customerTools(store)]
    : route === "owner" ? [...shared, ...ownerTools(store)]
      : route === "operations" ? shared
      : route === "evidence" ? evidenceTool()
        : route === "receipt" ? receiptTool(store)
          : [];

  const errors = await Promise.all(tools.map(async (tool) => {
    try {
      const instrumented: ToolDefinition = {
        ...tool,
        execute: async (input, options) => {
          const startedAt = new Date().toISOString();
          const started = performance.now();
          try {
            const output = await tool.execute(input, options);
            const envelope = output && typeof output === "object" ? output as { ok?: unknown; code?: unknown } : {};
            operationsStore.recordMetric({
              toolName: tool.name,
              route,
              startedAt,
              durationMs: Number((performance.now() - started).toFixed(2)),
              ok: envelope.ok !== false,
              code: typeof envelope.code === "string" ? envelope.code : "OK",
              readOnly: tool.annotations?.readOnlyHint === true,
            });
            return output;
          } catch (error) {
            operationsStore.recordMetric({
              toolName: tool.name,
              route,
              startedAt,
              durationMs: Number((performance.now() - started).toFixed(2)),
              ok: false,
              code: "UNCAUGHT_ERROR",
              readOnly: tool.annotations?.readOnlyHint === true,
            });
            throw error;
          }
        },
      };
      await modelContext.registerTool(instrumented, { signal: controller.signal });
      return "";
    } catch (error) {
      return `${tool.name}: ${error instanceof Error ? error.message : "registration failed"}`;
    }
  }));
  tools.forEach((tool, index) => {
    if (errors[index]) status.errors.push(errors[index]);
    else status.registered.push(tool.name);
  });
  return status;
}

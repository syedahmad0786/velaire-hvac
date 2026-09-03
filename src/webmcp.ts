import {
  checkServiceFit,
  compareChangeOrder,
  compareOfferVersions,
  getEvidence,
  nextActionsFor,
  type EvidenceTopic,
  type ServiceCase,
  type ToolResult,
  type Urgency,
} from "./domain";
import { PromiseDiffStore } from "./store";

export type ToolRoute = "customer" | "owner" | "evidence" | "receipt" | "none";

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

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Input must be an object.");
  return value as Record<string, unknown>;
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
    effect: "Read authoritative PromiseDiff state without changing it.",
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

function ownerRevision(serviceCase: ServiceCase): number {
  return Math.max(
    0,
    ...serviceCase.messages.filter((item) => item.actor === "owner").map((item) => item.revision),
    ...serviceCase.offers.map((item) => item.revision),
    ...serviceCase.changeOrders.map((item) => item.revision),
  );
}

function casePayload(serviceCase: ServiceCase) {
  return {
    ...serviceCase,
    pendingHumanAction:
      serviceCase.status === "booking_prepared"
        ? "Customer must confirm or cancel the displayed booking terms."
        : serviceCase.status === "change_pending"
          ? "Customer must accept or reject the displayed change order."
          : serviceCase.ownerDraft
            ? "Owner has a private draft that must be sent from the owner page."
            : null,
    customerUrl: canonical(`/demo/customer?case=${encodeURIComponent(serviceCase.id)}`),
    ownerUrl: canonical(`/demo/owner?case=${encodeURIComponent(serviceCase.id)}`),
    nextActions: nextActionsFor(serviceCase),
  };
}

export function waitForOwnerReply(
  store: PromiseDiffStore,
  caseId: string,
  afterRevision: number,
  maxWaitSeconds: number,
  signal?: AbortSignal,
): Promise<ToolResult> {
  const find = () => store.getSnapshot().cases.find((item) => item.id === caseId);
  const current = find();
  if (!current) return Promise.resolve(notFound(`Service case ${caseId}`));
  if (ownerRevision(current) > afterRevision) {
    return Promise.resolve(readResult(casePayload(current), current.revision, current.id, nextActionsFor(current)));
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
        code: "WAIT_EXPIRED",
        caseId,
        beforeRevision: latest?.revision ?? afterRevision,
        afterRevision: latest?.revision ?? afterRevision,
        effect: `No newer owner event arrived within ${maxWaitSeconds} seconds.`,
        didNot: ["No case state changed.", "ChatGPT was not subscribed after the tool call ended."],
        humanActionRequired: false,
        data: latest ? casePayload(latest) : undefined,
        nextActions: ["get_service_case"],
      });
    }, Math.max(1, Math.min(20, maxWaitSeconds)) * 1000);

    unsubscribe = store.subscribe(() => {
      const latest = find();
      if (latest && ownerRevision(latest) > afterRevision) {
        finish(readResult(casePayload(latest), latest.revision, latest.id, nextActionsFor(latest)));
      }
    });
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

type ToolDefinition = WebMCPTool;

function customerTools(store: PromiseDiffStore): ToolDefinition[] {
  return [
    {
      name: "promisediff_check_service_fit",
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
          const input = record(value);
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
      name: "promisediff_get_business_evidence",
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
          const input = record(value);
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
      name: "promisediff_open_service_case",
      title: "Open service case",
      description: "Creates a bounded synthetic HVAC service case for owner review. It never books an appointment, charges payment, or collect exact address, phone, email, or payment details.",
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
        },
      },
      execute: (value) => {
        try {
          const input = record(value);
          return store.dispatch({
            type: "OPEN_CASE",
            serviceId: oneOf(input, "serviceId", ["ac-diagnostic", "ac-repair", "seasonal-tune-up"] as const),
            problemSummary: requiredString(input, "problemSummary", 800),
            postcode: requiredString(input, "postcode", 12),
            urgency: oneOf<Urgency>(input, "urgency", ["same_day", "next_3_days", "flexible"]),
            budgetCents: optionalInteger(input, "budgetCents"),
            preferredWindows: strings(input, "preferredWindows", 4, 120),
            constraints: strings(input, "constraints", 8, 240),
          }, "promisediff_open_service_case", "customer_agent");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "promisediff_get_service_case",
      title: "Get service case",
      description: "Reads the authoritative service case, revision, messages, offers, pending human action, booking, and change orders. It changes nothing.",
      inputSchema: { type: "object", additionalProperties: false, required: ["caseId"], properties: { caseId: CASE_ID } },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (value) => {
        try {
          const input = record(value);
          const caseId = requiredString(input, "caseId", 80);
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          return serviceCase
            ? readResult(casePayload(serviceCase), serviceCase.revision, serviceCase.id, nextActionsFor(serviceCase))
            : notFound(`Service case ${caseId}`);
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "promisediff_wait_for_owner_reply",
      title: "Wait for owner reply",
      description: "Waits up to 20 seconds for a newer owner message, sent offer, or sent change order. It observes browser cancellation and never changes the case.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["caseId", "afterRevision"],
        properties: { caseId: CASE_ID, afterRevision: REVISION, maxWaitSeconds: { type: "integer", minimum: 1, maximum: 20 } },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (value, options) => {
        try {
          const input = record(value);
          return waitForOwnerReply(
            store,
            requiredString(input, "caseId", 80),
            integer(input, "afterRevision", 0),
            optionalInteger(input, "maxWaitSeconds", 1, 20) ?? 10,
            options.signal,
          );
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "promisediff_submit_case_message",
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
      execute: (value) => {
        try {
          const input = record(value);
          return store.dispatch({
            type: "CUSTOMER_MESSAGE",
            caseId: requiredString(input, "caseId", 80),
            expectedRevision: integer(input, "expectedRevision", 0),
            kind: oneOf(input, "kind", ["question", "counter"] as const),
            text: requiredString(input, "text", 1000),
            proposedBudgetCents: optionalInteger(input, "proposedBudgetCents"),
            preferredWindow: optionalString(input, "preferredWindow", 160),
          }, "promisediff_submit_case_message", "customer_agent");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "promisediff_compare_offer_versions",
      title: "Compare offer versions",
      description: "Deterministically compares two sent offers across price, deposit, schedule, scope, exclusions, warranty, and expiry. It changes nothing.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "fromVersion", "toVersion"],
        properties: { caseId: CASE_ID, fromVersion: { type: "integer", minimum: 1 }, toVersion: { type: "integer", minimum: 1 } },
      },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value);
          const caseId = requiredString(input, "caseId", 80);
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
      name: "promisediff_prepare_booking",
      title: "Prepare booking",
      description: "Stages the latest exact sent offer for visible customer confirmation. It cannot confirm the booking or take a deposit; only the human customer can commit it in the page.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "expectedRevision", "offerVersion"],
        properties: { caseId: CASE_ID, expectedRevision: REVISION, offerVersion: { type: "integer", minimum: 1 } },
      },
      execute: (value) => {
        try {
          const input = record(value);
          return store.dispatch({
            type: "PREPARE_BOOKING",
            caseId: requiredString(input, "caseId", 80),
            expectedRevision: integer(input, "expectedRevision", 0),
            offerVersion: integer(input, "offerVersion", 1),
          }, "promisediff_prepare_booking", "customer_agent");
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "promisediff_get_booking_receipt",
      title: "Get booking receipt",
      description: "Returns the immutable accepted-offer snapshot and recorded change-order decisions for a simulated booking. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, required: ["receiptId"], properties: { receiptId: text(80) } },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value);
          const receiptId = requiredString(input, "receiptId", 80);
          const serviceCase = store.getSnapshot().cases.find((item) => item.receipt?.id === receiptId);
          return serviceCase?.receipt
            ? readResult({ ...serviceCase.receipt, receiptUrl: canonical(`/receipt/${receiptId}`) }, serviceCase.revision, serviceCase.id)
            : notFound(`Receipt ${receiptId}`);
        } catch (error) {
          return invalid(error);
        }
      },
    },
    {
      name: "promisediff_compare_change_order",
      title: "Compare change order",
      description: "Compares a sent change order with the immutable accepted booking snapshot, including price and scope. It does not judge, accept, reject, or pay the charge.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "changeOrderId"],
        properties: { caseId: CASE_ID, changeOrderId: text(80) },
      },
      annotations: { readOnlyHint: true },
      execute: (value) => {
        try {
          const input = record(value);
          const caseId = requiredString(input, "caseId", 80);
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          if (!serviceCase) return notFound(`Service case ${caseId}`);
          const comparison = compareChangeOrder(serviceCase, requiredString(input, "changeOrderId", 80));
          return comparison ? readResult(comparison, serviceCase.revision, caseId) : notFound("Change order or booking receipt");
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
      name: "promisediff_list_service_cases",
      title: "List service cases",
      description: "Lists the synthetic service-case queue with revision, status, summary, and owner deep link. Read-only.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => readResult(store.getSnapshot().cases.map((item) => ({
        id: item.id, status: item.status, revision: item.revision, problemSummary: item.problemSummary,
        postcode: item.postcode, ownerUrl: canonical(`/demo/owner?case=${encodeURIComponent(item.id)}`),
      }))),
    },
    {
      name: "promisediff_get_owner_case",
      title: "Get owner case",
      description: "Reads one authoritative service case for owner review. It changes and sends nothing.",
      inputSchema: { type: "object", additionalProperties: false, required: ["caseId"], properties: { caseId: CASE_ID } },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (value) => {
        try {
          const input = record(value);
          const caseId = requiredString(input, "caseId", 80);
          const serviceCase = store.getSnapshot().cases.find((item) => item.id === caseId);
          return serviceCase ? readResult(casePayload(serviceCase), serviceCase.revision, caseId) : notFound(`Service case ${caseId}`);
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "promisediff_stage_owner_reply",
      title: "Stage owner reply",
      description: "Creates a private owner reply draft at an exact revision. The customer cannot see it and the agent cannot send it; the human owner must press Send.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["caseId", "expectedRevision", "text"],
        properties: { caseId: CASE_ID, expectedRevision: REVISION, text: text(1000) },
      },
      execute: (value) => {
        try {
          const input = record(value);
          return store.dispatch({ type: "STAGE_OWNER_REPLY", caseId: requiredString(input, "caseId", 80), expectedRevision: integer(input, "expectedRevision"), text: requiredString(input, "text", 1000) }, "promisediff_stage_owner_reply", "owner_agent");
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "promisediff_stage_service_offer",
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
      execute: (value) => {
        try {
          const input = record(value);
          return store.dispatch({
            type: "STAGE_OFFER", caseId: requiredString(input, "caseId", 80), expectedRevision: integer(input, "expectedRevision"),
            totalCents: integer(input, "totalCents", 1), arrivalWindow: requiredString(input, "arrivalWindow", 160),
            includedScope: strings(input, "includedScope", 10), exclusions: strings(input, "exclusions", 10),
            depositCents: integer(input, "depositCents"), warrantyDays: integer(input, "warrantyDays", 0, 3650),
            expiresAt: requiredString(input, "expiresAt", 80),
          }, "promisediff_stage_service_offer", "owner_agent");
        } catch (error) { return invalid(error); }
      },
    },
    {
      name: "promisediff_stage_change_order",
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
      execute: (value) => {
        try {
          const input = record(value);
          return store.dispatch({
            type: "STAGE_CHANGE_ORDER", caseId: requiredString(input, "caseId", 80), expectedRevision: integer(input, "expectedRevision"),
            reason: requiredString(input, "reason", 600), addedScope: strings(input, "addedScope", 10),
            removedScope: strings(input, "removedScope", 10), deltaCents: integer(input, "deltaCents", 1),
            scheduleImpact: requiredString(input, "scheduleImpact", 240),
          }, "promisediff_stage_change_order", "owner_agent");
        } catch (error) { return invalid(error); }
      },
    },
  ];
}

function evidenceTool(): ToolDefinition[] {
  return [{
    name: "promisediff_get_evidence_source",
    title: "Get evidence source",
    description: "Returns the synthetic source card displayed on this canonical evidence page. Read-only and not independently verified.",
    inputSchema: { type: "object", additionalProperties: false, required: ["sourceId"], properties: { sourceId: text(80) } },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: (value) => {
      try {
        const input = record(value);
        const sourceId = requiredString(input, "sourceId", 80);
        const source = getEvidence().find((item) => item.id === sourceId);
        return source ? readResult({ ...source, sourceUrl: canonical(source.canonicalPath) }) : notFound(`Evidence source ${sourceId}`);
      } catch (error) { return invalid(error); }
    },
  }];
}

function receiptTool(store: PromiseDiffStore): ToolDefinition[] {
  return [{
    name: "promisediff_get_receipt_snapshot",
    title: "Get receipt snapshot",
    description: "Returns the immutable accepted-offer snapshot shown on this simulated receipt page. Read-only; it does not represent a real payment or appointment.",
    inputSchema: { type: "object", additionalProperties: false, required: ["receiptId"], properties: { receiptId: text(80) } },
    annotations: { readOnlyHint: true },
    execute: (value) => {
      try {
        const input = record(value);
        const receiptId = requiredString(input, "receiptId", 80);
        const serviceCase = store.getSnapshot().cases.find((item) => item.receipt?.id === receiptId);
        return serviceCase?.receipt ? readResult(serviceCase.receipt, serviceCase.revision, serviceCase.id) : notFound(`Receipt ${receiptId}`);
      } catch (error) { return invalid(error); }
    },
  }];
}

export async function installWebMCP(store: PromiseDiffStore, route: ToolRoute): Promise<WebMCPStatus> {
  const controller = new AbortController();
  const status: WebMCPStatus = { supported: false, registered: [], errors: [], dispose: () => controller.abort() };
  if (window.top !== window || !document.modelContext?.registerTool) return status;
  status.supported = true;
  const tools = route === "customer" ? customerTools(store)
    : route === "owner" ? ownerTools(store)
      : route === "evidence" ? evidenceTool()
        : route === "receipt" ? receiptTool(store)
          : [];

  for (const tool of tools) {
    try {
      await document.modelContext.registerTool(tool, { signal: controller.signal });
      status.registered.push(tool.name);
    } catch (error) {
      status.errors.push(`${tool.name}: ${error instanceof Error ? error.message : "registration failed"}`);
    }
  }
  return status;
}

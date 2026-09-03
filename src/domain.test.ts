import { describe, expect, it, vi } from "vitest";
import {
  auditInvoiceAgainstReceipt,
  checkServiceFit,
  compareChangeOrder,
  compareOfferVersions,
  estimateServiceRange,
  getProjectPreflight,
  initialState,
  type Command,
  type RuntimeContext,
} from "./domain";
import { PromiseDiffStore } from "./store";
import { installWebMCP, waitForOwnerReply } from "./webmcp";
import { compareQuoteContext, createProjectPlan, getMarketContext, searchSite, summarizeMetrics } from "./operations";

const context: RuntimeContext = (() => {
  let id = 0;
  let second = 0;
  return {
    id: (prefix) => `${prefix}-TEST-${++id}`,
    now: () => new Date(Date.UTC(2026, 8, 3, 12, 0, second++)).toISOString(),
  };
})();

function send(store: PromiseDiffStore, command: Command) {
  return store.dispatch(command, `test_${command.type.toLowerCase()}`, "system", context);
}

function openCase(store: PromiseDiffStore) {
  const result = send(store, {
    type: "OPEN_CASE",
    serviceId: "ac-diagnostic",
    problemSummary: "AC is blowing warm air.",
    postcode: "60614",
    urgency: "same_day",
    budgetCents: 18000,
    preferredWindows: ["Today, 2–4 PM"],
    constraints: ["Approval before additional work"],
  });
  return result.caseId!;
}

describe("Velaire agreement boundary", () => {
  it("keeps market context sourced and project plans bounded", () => {
    const market = getMarketContext(3);
    expect(market.observations).toHaveLength(3);
    expect(market.seriesId).toBe("PCU23822X23822X");
    expect(market.limitation).toContain("not a Chicago residential quote");
    expect(compareQuoteContext("ac-diagnostic", 17500)?.position).toBe("above_published_velaire_band");
    expect(searchSite("change approval", "policies").length).toBeGreaterThan(0);
    const plan = createProjectPlan({ projectType: "heat_pump_upgrade", startDate: "2026-09-08", durationDays: 7 });
    expect(plan.tasks.at(-1)?.endDay).toBe(7);
    expect(() => createProjectPlan({ projectType: "repair", startDate: "2026-09-08", durationDays: 2 })).toThrow("3 to 10");
    expect(summarizeMetrics([]).successRate).toBe(100);
  });

  it("stops ordinary booking for HVAC emergency language", () => {
    const store = new PromiseDiffStore(initialState());
    const result = send(store, {
      type: "OPEN_CASE",
      serviceId: "ac-diagnostic",
      problemSummary: "There is smoke and sparking from the unit.",
      postcode: "60614",
      urgency: "same_day",
      preferredWindows: [],
      constraints: [],
    });
    expect(result.code).toBe("SAFETY_STOP");
    expect(store.getSnapshot().cases).toHaveLength(0);
    expect(checkServiceFit({ need: "CO alarm is sounding", postcode: "60614", urgency: "same_day" }).safetyStatus).toBe("stop_and_seek_emergency_help");
    expect(checkServiceFit({
      need: "AC is warm, with no smoke, sparks, fire, gas smell, or carbon monoxide alarm.",
      postcode: "60614",
      urgency: "same_day",
    }).safetyStatus).toBe("standard_service_flow");
  });

  it("keeps drafts private, revisions writes, snapshots acceptance, and diffs changed work", () => {
    const store = new PromiseDiffStore(initialState());
    const caseId = openCase(store);
    let serviceCase = store.getSnapshot().cases[0];

    const staged = send(store, {
      type: "STAGE_OFFER", caseId, expectedRevision: 1, totalCents: 19500,
      arrivalWindow: "Today, 2–4 PM", includedScope: ["Diagnostic and labour"],
      exclusions: ["Parts and refrigerant"], depositCents: 4900, warrantyDays: 30,
      expiresAt: "2026-09-04T12:00:00.000Z",
    });
    serviceCase = store.getSnapshot().cases[0];
    expect(staged.code).toBe("AWAITING_HUMAN");
    expect(serviceCase.revision).toBe(1);
    expect(serviceCase.offers).toHaveLength(0);
    expect(serviceCase.ownerDraft?.kind).toBe("offer");

    send(store, { type: "SEND_OFFER", caseId });
    serviceCase = store.getSnapshot().cases[0];
    expect(serviceCase.revision).toBe(2);
    expect(serviceCase.offers).toHaveLength(1);

    const stale = send(store, { type: "CUSTOMER_MESSAGE", caseId, expectedRevision: 1, kind: "counter", text: "$175 maximum" });
    expect(stale.code).toBe("STALE_REVISION");
    expect(store.getSnapshot().cases[0].revision).toBe(2);

    send(store, { type: "CUSTOMER_MESSAGE", caseId, expectedRevision: 2, kind: "counter", text: "$175 maximum", proposedBudgetCents: 17500 });
    send(store, {
      type: "STAGE_OFFER", caseId, expectedRevision: 3, totalCents: 17500,
      arrivalWindow: "Today, 2–4 PM", includedScope: ["Diagnostic and labour"],
      exclusions: ["Parts and refrigerant", "After-hours surcharge"], depositCents: 4900,
      warrantyDays: 30, expiresAt: "2026-09-04T12:00:00.000Z",
    });
    send(store, { type: "SEND_OFFER", caseId });
    serviceCase = store.getSnapshot().cases[0];
    expect(compareOfferVersions(serviceCase, 1, 2)?.priceDeltaCents).toBe(-2000);

    send(store, { type: "PREPARE_BOOKING", caseId, expectedRevision: 4, offerVersion: 2 });
    serviceCase = store.getSnapshot().cases[0];
    expect(serviceCase.status).toBe("booking_prepared");
    expect(serviceCase.receipt).toBeUndefined();
    send(store, { type: "CONFIRM_BOOKING", caseId });
    serviceCase = store.getSnapshot().cases[0];
    expect(serviceCase.receipt?.acceptedOffer.totalCents).toBe(17500);

    send(store, {
      type: "STAGE_CHANGE_ORDER", caseId, expectedRevision: 6,
      reason: "Weak capacitor", addedScope: ["Replacement part: capacitor"], removedScope: [],
      deltaCents: 14500, scheduleImpact: "Adds 30 minutes",
    });
    send(store, { type: "SEND_CHANGE_ORDER", caseId });
    serviceCase = store.getSnapshot().cases[0];
    const change = serviceCase.changeOrders[0];
    const comparison = compareChangeOrder(serviceCase, change.id)!;
    expect(comparison.proposedTotalCents).toBe(32000);
    expect(comparison.explicitlyExcluded).toEqual(["Replacement part: capacitor"]);
    const wordingVariant = structuredClone(serviceCase);
    wordingVariant.receipt!.acceptedOffer.exclusions = ["Replacement parts", "Refrigerant"];
    wordingVariant.changeOrders[0].addedScope = ["Replace failed capacitor"];
    expect(compareChangeOrder(wordingVariant, change.id)?.explicitlyExcluded).toEqual(["Replace failed capacitor"]);
    send(store, { type: "DECIDE_CHANGE_ORDER", caseId, changeOrderId: change.id, decision: "rejected" });
    expect(store.getSnapshot().cases[0].receipt?.acceptedOffer.totalCents).toBe(17500);

    const invoice = auditInvoiceAgainstReceipt(store.getSnapshot().cases[0], [
      { description: "Accepted diagnostic", amountCents: 17500, kind: "accepted_offer", authorizationRef: "offer-v2" },
      { description: "Unapproved dispatch fee", amountCents: 2500, kind: "other" },
    ])!;
    expect(invoice.deltaFromAuthorizedCents).toBe(2500);
    expect(invoice.allLinesTraceToHumanApproval).toBe(false);
    expect(invoice.unresolvedLineIndexes).toEqual([1]);
  });

  it("produces transparent planning ranges and freshness-dated project preflights", () => {
    const estimate = estimateServiceRange({
      serviceId: "ac-diagnostic", urgency: "same_day", access: "limited", knownFinding: "capacitor",
    })!;
    expect(estimate.minCents).toBe(20900);
    expect(estimate.maxCents).toBe(46400);
    expect(estimate.basis).toContain("Fictional");

    const preflight = getProjectPreflight({
      postcode: "60614", projectType: "heat_pump_upgrade", buildingType: "multifamily", installationLocation: "rooftop",
    });
    expect(preflight.supportedDemoPostcode).toBe(true);
    expect(preflight.checklist).toContain("Property-owner or building-management authorization");
    expect(preflight.officialSources.every((source) => source.checkedAt === "2026-09-03")).toBe(true);
    expect(preflight.officialSources.find((source) => source.authority === "ENERGY STAR")?.status).toContain("ended_2025");
  });

  it("resolves a pending wait only after a human-sent owner event and leaves abort recoverable", async () => {
    const store = new PromiseDiffStore(initialState());
    const caseId = openCase(store);
    const wait = waitForOwnerReply(store, caseId, 1, 20);
    send(store, { type: "STAGE_OWNER_REPLY", caseId, expectedRevision: 1, text: "Draft only" });
    let resolved = false;
    wait.then(() => { resolved = true; });
    await Promise.resolve();
    expect(resolved).toBe(false);
    send(store, { type: "SEND_OWNER_REPLY", caseId });
    expect((await wait).code).toBe("OK");

    const controller = new AbortController();
    controller.abort();
    const aborted = await waitForOwnerReply(store, caseId, 2, 20, controller.signal);
    expect(aborted.code).toBe("WAIT_EXPIRED");
    expect(store.getSnapshot().cases[0].revision).toBe(2);
  });

  it("registers exactly the route-scoped tool surface", async () => {
    const registrations: WebMCPTool[] = [];
    const store = new PromiseDiffStore(initialState());
    const caseId = openCase(store);
    send(store, { type: "STAGE_OWNER_REPLY", caseId, expectedRevision: 1, text: "Private draft" });
    const fakeWindow = { location: { origin: "https://example.test" }, dispatchEvent: vi.fn() } as unknown as Window;
    Object.defineProperty(fakeWindow, "top", { value: fakeWindow });
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", { modelContext: { registerTool: (tool: WebMCPTool) => { registrations.push(tool); } } });
    const customer = await installWebMCP(store, "customer");
    expect(customer.registered).toHaveLength(26);
    expect(customer.registered).toContain("velaire_get_site_manifest");
    expect(customer.registered).toContain("velaire_get_market_price_context");
    expect(customer.registered).toContain("velaire_prepare_project_plan");
    expect(customer.registered).toContain("velaire_get_webmcp_health");
    expect(customer.registered).toContain("velaire_compare_change_order");
    expect(customer.registered).toContain("velaire_audit_invoice_against_receipt");
    const customerRead = await registrations.find((tool) => tool.name === "velaire_get_service_case")!.execute(
      { caseId }, { signal: new AbortController().signal },
    ) as { data: Record<string, unknown> };
    expect(customerRead.data).not.toHaveProperty("ownerDraft");
    const customerWrite = await registrations.find((tool) => tool.name === "velaire_submit_case_message")!.execute(
      { caseId, expectedRevision: 1, kind: "question", text: "Please confirm availability." },
      { signal: new AbortController().signal },
    ) as { data: Record<string, unknown> };
    expect(customerWrite.data).not.toHaveProperty("ownerDraft");
    const unexpected = await registrations.find((tool) => tool.name === "velaire_check_service_fit")!.execute(
      { need: "warm air", postcode: "60614", urgency: "same_day", unexpected: true },
      { signal: new AbortController().signal },
    ) as { code: string; effect: string };
    expect(unexpected.code).toBe("INVALID_STATE");
    expect(unexpected.effect).toContain("Unknown input property");
    const market = await registrations.find((tool) => tool.name === "velaire_get_market_price_context")!.execute(
      { months: 3 }, { signal: new AbortController().signal },
    ) as { code: string; data: { observations: unknown[] } };
    expect(market.code).toBe("OK");
    expect(market.data.observations).toHaveLength(3);
    const invalidMarket = await registrations.find((tool) => tool.name === "velaire_get_market_price_context")!.execute(
      { months: 2 }, { signal: new AbortController().signal },
    ) as { code: string };
    expect(invalidMarket.code).toBe("INVALID_STATE");
    customer.dispose();
    registrations.length = 0;
    const owner = await installWebMCP(store, "owner");
    expect(owner.registered).toHaveLength(18);
    expect(owner.registered).not.toContain("velaire_prepare_booking");
    const ownerRead = await registrations.find((tool) => tool.name === "velaire_get_owner_case")!.execute(
      { caseId }, { signal: new AbortController().signal },
    ) as { data: Record<string, unknown> };
    expect(ownerRead.data).toHaveProperty("ownerDraft");
    owner.dispose();
    vi.unstubAllGlobals();
  });

  it("starts every route registration without serial blocking", async () => {
    const registrations: WebMCPTool[] = [];
    const releases: Array<() => void> = [];
    const fakeWindow = { location: { origin: "https://example.test" } } as unknown as Window;
    Object.defineProperty(fakeWindow, "top", { value: fakeWindow });
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", {
      modelContext: {
        registerTool: (tool: WebMCPTool) => {
          registrations.push(tool);
          return new Promise<void>((resolve) => releases.push(resolve));
        },
      },
    });
    const pending = installWebMCP(new PromiseDiffStore(initialState()), "customer");
    expect(registrations).toHaveLength(26);
    releases.forEach((release) => release());
    expect((await pending).registered).toHaveLength(26);
    vi.unstubAllGlobals();
  });
});

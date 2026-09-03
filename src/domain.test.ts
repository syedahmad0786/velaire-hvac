import { describe, expect, it, vi } from "vitest";
import { checkServiceFit, compareChangeOrder, compareOfferVersions, initialState, type Command, type RuntimeContext } from "./domain";
import { PromiseDiffStore } from "./store";
import { installWebMCP, waitForOwnerReply } from "./webmcp";

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

describe("PromiseDiff agreement boundary", () => {
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
    send(store, { type: "DECIDE_CHANGE_ORDER", caseId, changeOrderId: change.id, decision: "rejected" });
    expect(store.getSnapshot().cases[0].receipt?.acceptedOffer.totalCents).toBe(17500);
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
    const registrations: string[] = [];
    const fakeWindow = { location: { origin: "https://example.test" } } as unknown as Window;
    Object.defineProperty(fakeWindow, "top", { value: fakeWindow });
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", { modelContext: { registerTool: (tool: WebMCPTool) => { registrations.push(tool.name); } } });
    const store = new PromiseDiffStore(initialState());
    const customer = await installWebMCP(store, "customer");
    expect(customer.registered).toHaveLength(10);
    expect(customer.registered).toContain("promisediff_compare_change_order");
    customer.dispose();
    registrations.length = 0;
    const owner = await installWebMCP(store, "owner");
    expect(owner.registered).toHaveLength(5);
    expect(owner.registered).not.toContain("promisediff_prepare_booking");
    owner.dispose();
    vi.unstubAllGlobals();
  });
});

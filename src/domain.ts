export type Urgency = "same_day" | "next_3_days" | "flexible";

export type CaseStatus =
  | "awaiting_provider"
  | "offer_available"
  | "negotiating"
  | "booking_prepared"
  | "booked"
  | "change_pending";

export type ToolCode =
  | "OK"
  | "SAFETY_STOP"
  | "AWAITING_OWNER"
  | "WAIT_EXPIRED"
  | "STALE_REVISION"
  | "AWAITING_HUMAN"
  | "OFFER_EXPIRED"
  | "INVALID_STATE"
  | "NOT_FOUND";

export interface ToolResult<T = unknown> {
  ok: boolean;
  code: ToolCode;
  caseId?: string;
  beforeRevision: number;
  afterRevision: number;
  effect: string;
  didNot: string[];
  humanActionRequired: boolean;
  data?: T;
  nextActions: string[];
}

export interface ServiceOption {
  id: string;
  name: string;
  summary: string;
  minCents: number;
  maxCents: number;
  sameDayEligible: boolean;
  requiredDetails: string[];
  canonicalPath: string;
}

export type EvidenceTopic =
  | "credentials"
  | "pricing"
  | "availability"
  | "cancellation"
  | "warranty"
  | "reviews";

export interface SourceCard {
  id: string;
  topic: EvidenceTopic;
  claim: string;
  publisher: string;
  evidenceType: "provider_record" | "published_policy" | "customer_review";
  canonicalPath: string;
  refreshedAt: string;
  synthetic: true;
  independentlyVerified: false;
}

export interface CaseMessage {
  id: string;
  actor: "customer" | "owner" | "system";
  kind: "request" | "question" | "counter" | "owner_reply" | "status";
  text: string;
  createdAt: string;
  revision: number;
}

export interface ServiceOffer {
  version: number;
  totalCents: number;
  currency: "USD";
  arrivalWindow: string;
  includedScope: string[];
  exclusions: string[];
  depositCents: number;
  warrantyDays: number;
  expiresAt: string;
  sentAt: string;
  revision: number;
}

export interface BookingReceipt {
  id: string;
  caseId: string;
  simulated: true;
  confirmedAt: string;
  acceptedOffer: ServiceOffer;
  decisions: Array<{
    changeOrderId: string;
    decision: "accepted" | "rejected";
    decidedAt: string;
  }>;
}

export interface ChangeOrder {
  id: string;
  baseOfferVersion: number;
  reason: string;
  addedScope: string[];
  removedScope: string[];
  deltaCents: number;
  scheduleImpact: string;
  status: "pending" | "accepted" | "rejected";
  sentAt: string;
  revision: number;
}

export type OwnerDraft =
  | {
      kind: "reply";
      baseRevision: number;
      text: string;
      stagedAt: string;
    }
  | {
      kind: "offer";
      baseRevision: number;
      totalCents: number;
      arrivalWindow: string;
      includedScope: string[];
      exclusions: string[];
      depositCents: number;
      warrantyDays: number;
      expiresAt: string;
      stagedAt: string;
    }
  | {
      kind: "change_order";
      baseRevision: number;
      reason: string;
      addedScope: string[];
      removedScope: string[];
      deltaCents: number;
      scheduleImpact: string;
      stagedAt: string;
    };

export interface ServiceCase {
  id: string;
  status: CaseStatus;
  revision: number;
  serviceId: string;
  problemSummary: string;
  postcode: string;
  urgency: Urgency;
  budgetCents?: number;
  preferredWindows: string[];
  constraints: string[];
  createdAt: string;
  messages: CaseMessage[];
  offers: ServiceOffer[];
  ownerDraft?: OwnerDraft;
  bookingPreparation?: {
    offerVersion: number;
    preparedAt: string;
    revision: number;
  };
  receipt?: BookingReceipt;
  changeOrders: ChangeOrder[];
}

export interface AuditEvent {
  id: string;
  operation: string;
  actor: "customer_agent" | "owner_agent" | "customer_human" | "owner_human" | "system";
  code: ToolCode;
  caseId?: string;
  beforeRevision: number;
  afterRevision: number;
  effect: string;
  occurredAt: string;
}

export interface AppState {
  schemaVersion: 1;
  cases: ServiceCase[];
  audit: AuditEvent[];
}

export type EstimateAccess = "standard" | "limited" | "rooftop";
export type KnownFinding = "unknown" | "capacitor" | "thermostat" | "refrigerant" | "compressor";
export type ProjectType = "diagnostic" | "repair" | "equipment_replacement" | "heat_pump_upgrade";
export type BuildingType = "single_family" | "multifamily" | "commercial";
export type InstallationLocation = "indoor" | "outdoor_ground" | "rooftop";
export type InvoiceLineKind = "accepted_offer" | "approved_change" | "tax_or_required_fee" | "other";

export interface InvoiceLineInput {
  description: string;
  amountCents: number;
  kind: InvoiceLineKind;
  authorizationRef?: string;
}

export interface RuntimeContext {
  now: () => string;
  id: (prefix: string) => string;
}

export const SERVICES: ServiceOption[] = [
  {
    id: "ac-diagnostic",
    name: "Cooling diagnostic",
    summary: "A bounded visit to identify why an AC system is not cooling.",
    minCents: 8900,
    maxCents: 16900,
    sameDayEligible: true,
    requiredDetails: ["Postcode", "System symptom", "Preferred arrival window"],
    canonicalPath: "/evidence/pricing",
  },
  {
    id: "ac-repair",
    name: "AC repair",
    summary: "Repair work priced after a diagnostic, with parts approved separately.",
    minCents: 14000,
    maxCents: 32000,
    sameDayEligible: true,
    requiredDetails: ["Postcode", "Observed symptom", "Budget ceiling", "Availability"],
    canonicalPath: "/evidence/pricing",
  },
  {
    id: "seasonal-tune-up",
    name: "Seasonal tune-up",
    summary: "Preventive inspection, cleaning, and performance checks.",
    minCents: 12900,
    maxCents: 18900,
    sameDayEligible: false,
    requiredDetails: ["Postcode", "System type", "Preferred date"],
    canonicalPath: "/evidence/availability",
  },
];

export const EVIDENCE: SourceCard[] = [
  {
    id: "credentials",
    topic: "credentials",
    claim: "Velaire lists a current trade licence and general-liability cover in this fictional demonstration.",
    publisher: "Velaire Heating & Air",
    evidenceType: "provider_record",
    canonicalPath: "/evidence/credentials",
    refreshedAt: "2026-09-03T00:00:00.000Z",
    synthetic: true,
    independentlyVerified: false,
  },
  {
    id: "pricing",
    topic: "pricing",
    claim: "The diagnostic range is $89–$169. Parts and changed work require a separate, visible approval.",
    publisher: "Velaire Heating & Air",
    evidenceType: "published_policy",
    canonicalPath: "/evidence/pricing",
    refreshedAt: "2026-09-03T00:00:00.000Z",
    synthetic: true,
    independentlyVerified: false,
  },
  {
    id: "availability",
    topic: "availability",
    claim: "Same-day requests are considered in 60610, 60613, 60614, and 60657; a request is not a promised slot.",
    publisher: "Velaire Heating & Air",
    evidenceType: "published_policy",
    canonicalPath: "/evidence/availability",
    refreshedAt: "2026-09-03T00:00:00.000Z",
    synthetic: true,
    independentlyVerified: false,
  },
  {
    id: "cancellation",
    topic: "cancellation",
    claim: "A simulated booking can be cancelled without charge until one hour before the arrival window.",
    publisher: "Velaire Heating & Air",
    evidenceType: "published_policy",
    canonicalPath: "/evidence/cancellation",
    refreshedAt: "2026-09-03T00:00:00.000Z",
    synthetic: true,
    independentlyVerified: false,
  },
  {
    id: "warranty",
    topic: "warranty",
    claim: "Workmanship coverage is stated on each offer. Manufacturer parts coverage is separate.",
    publisher: "Velaire Heating & Air",
    evidenceType: "published_policy",
    canonicalPath: "/evidence/warranty",
    refreshedAt: "2026-09-03T00:00:00.000Z",
    synthetic: true,
    independentlyVerified: false,
  },
  {
    id: "reviews",
    topic: "reviews",
    claim: "Synthetic review: ‘The written price matched the invoice, and the technician asked before replacing a part.’",
    publisher: "Synthetic customer",
    evidenceType: "customer_review",
    canonicalPath: "/evidence/reviews",
    refreshedAt: "2026-09-03T00:00:00.000Z",
    synthetic: true,
    independentlyVerified: false,
  },
];

const SERVICE_POSTCODES = new Set(["60610", "60613", "60614", "60657"]);
const SAFETY_PHRASES = [
  "gas smell",
  "smell gas",
  "sparking",
  "sparks",
  "smoke",
  "on fire",
  "carbon monoxide",
  "co alarm",
];

export const initialState = (): AppState => ({
  schemaVersion: 1,
  cases: [],
  audit: [],
});

const defaultContext: RuntimeContext = {
  now: () => new Date().toISOString(),
  id: (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
};

export function hasSafetyStop(text: string): boolean {
  const normalized = text.toLowerCase();
  return SAFETY_PHRASES.some((phrase) => normalized.includes(phrase));
}

export function checkServiceFit(input: {
  need: string;
  postcode: string;
  urgency: Urgency;
  budgetCents?: number;
}) {
  const safetyStop = hasSafetyStop(input.need);
  const inServiceArea = SERVICE_POSTCODES.has(input.postcode.trim());
  const normalized = input.need.toLowerCase();
  const matches = SERVICES.filter((service) => {
    if (normalized.includes("tune") || normalized.includes("maintenance")) {
      return service.id === "seasonal-tune-up";
    }
    return service.id === "ac-diagnostic" || service.id === "ac-repair";
  });

  return {
    safetyStatus: safetyStop ? "stop_and_seek_emergency_help" : "standard_service_flow",
    serviceAreaStatus: inServiceArea ? "served" : "outside_demo_area",
    urgencySupported: input.urgency !== "same_day" || matches.some((service) => service.sameDayEligible),
    budgetStatus:
      input.budgetCents === undefined
        ? "not_provided"
        : matches.some((service) => input.budgetCents! >= service.minCents)
          ? "within_published_band"
          : "below_published_band",
    matchedServices: matches,
    requiredDetails: [...new Set(matches.flatMap((service) => service.requiredDetails))],
    disclaimer: safetyStop
      ? "Do not continue with ordinary booking. Leave the affected area and contact local emergency services or the utility emergency line."
      : "This is service-fit information, not an equipment diagnosis or a promised appointment.",
  };
}

export function getEvidence(topics?: EvidenceTopic[]): SourceCard[] {
  if (!topics?.length) return EVIDENCE;
  return EVIDENCE.filter((card) => topics.includes(card.topic));
}

export type Command =
  | {
      type: "OPEN_CASE";
      serviceId: string;
      problemSummary: string;
      postcode: string;
      urgency: Urgency;
      budgetCents?: number;
      preferredWindows: string[];
      constraints: string[];
    }
  | {
      type: "CUSTOMER_MESSAGE";
      caseId: string;
      expectedRevision: number;
      kind: "question" | "counter";
      text: string;
      proposedBudgetCents?: number;
      preferredWindow?: string;
    }
  | {
      type: "STAGE_OWNER_REPLY";
      caseId: string;
      expectedRevision: number;
      text: string;
    }
  | { type: "SEND_OWNER_REPLY"; caseId: string }
  | {
      type: "STAGE_OFFER";
      caseId: string;
      expectedRevision: number;
      totalCents: number;
      arrivalWindow: string;
      includedScope: string[];
      exclusions: string[];
      depositCents: number;
      warrantyDays: number;
      expiresAt: string;
    }
  | { type: "SEND_OFFER"; caseId: string }
  | {
      type: "PREPARE_BOOKING";
      caseId: string;
      expectedRevision: number;
      offerVersion: number;
    }
  | { type: "CANCEL_BOOKING_PREPARATION"; caseId: string }
  | { type: "CONFIRM_BOOKING"; caseId: string }
  | {
      type: "STAGE_CHANGE_ORDER";
      caseId: string;
      expectedRevision: number;
      reason: string;
      addedScope: string[];
      removedScope: string[];
      deltaCents: number;
      scheduleImpact: string;
    }
  | { type: "SEND_CHANGE_ORDER"; caseId: string }
  | {
      type: "DECIDE_CHANGE_ORDER";
      caseId: string;
      changeOrderId: string;
      decision: "accepted" | "rejected";
    };

export interface CommandOutcome {
  state: AppState;
  result: ToolResult;
}

function result<T>(options: {
  ok: boolean;
  code: ToolCode;
  caseId?: string;
  beforeRevision: number;
  afterRevision?: number;
  effect: string;
  didNot?: string[];
  humanActionRequired?: boolean;
  data?: T;
  nextActions?: string[];
}): ToolResult<T> {
  return {
    ok: options.ok,
    code: options.code,
    caseId: options.caseId,
    beforeRevision: options.beforeRevision,
    afterRevision: options.afterRevision ?? options.beforeRevision,
    effect: options.effect,
    didNot: options.didNot ?? [],
    humanActionRequired: options.humanActionRequired ?? false,
    data: options.data,
    nextActions: options.nextActions ?? [],
  };
}

function fail(
  state: AppState,
  code: ToolCode,
  effect: string,
  serviceCase?: ServiceCase,
  nextActions: string[] = [],
): CommandOutcome {
  return {
    state,
    result: result({
      ok: false,
      code,
      caseId: serviceCase?.id,
      beforeRevision: serviceCase?.revision ?? 0,
      effect,
      didNot: ["No case state changed."],
      nextActions,
    }),
  };
}

function currentCase(state: AppState, caseId: string): ServiceCase | undefined {
  return state.cases.find((item) => item.id === caseId);
}

function validText(value: string, max: number): boolean {
  return value.trim().length > 0 && value.trim().length <= max;
}

export function nextActionsFor(serviceCase: ServiceCase): string[] {
  switch (serviceCase.status) {
    case "awaiting_provider":
      return ["wait_for_owner_reply", "get_service_case"];
    case "negotiating":
      return ["wait_for_owner_reply", "get_service_case"];
    case "offer_available":
      return ["compare_offer_versions", "submit_case_message", "prepare_booking"];
    case "booking_prepared":
      return ["human_confirm_booking", "human_cancel_booking_preparation"];
    case "booked":
      return ["get_booking_receipt", "get_service_case"];
    case "change_pending":
      return ["compare_change_order", "human_accept_or_reject_change_order"];
  }
}

export function runCommand(
  state: AppState,
  command: Command,
  context: RuntimeContext = defaultContext,
): CommandOutcome {
  if (command.type === "OPEN_CASE") {
    if (
      !validText(command.problemSummary, 800) ||
      !SERVICES.some((service) => service.id === command.serviceId) ||
      command.preferredWindows.length > 4 ||
      command.constraints.length > 8
    ) {
      return fail(state, "INVALID_STATE", "The service request failed validation.");
    }
    if (hasSafetyStop(command.problemSummary)) {
      return {
        state,
        result: result({
          ok: false,
          code: "SAFETY_STOP",
          beforeRevision: 0,
          effect: "Ordinary booking was stopped because the request contains an emergency warning sign.",
          didNot: ["No service case was created.", "No diagnosis was made."],
          humanActionRequired: true,
          nextActions: ["leave_affected_area", "contact_local_emergency_or_utility_line"],
        }),
      };
    }
    if (!SERVICE_POSTCODES.has(command.postcode.trim())) {
      return fail(state, "INVALID_STATE", "The postcode is outside Velaire's published demo service area.");
    }

    const id = context.id("SC");
    const now = context.now();
    const serviceCase: ServiceCase = {
      id,
      status: "awaiting_provider",
      revision: 1,
      serviceId: command.serviceId,
      problemSummary: command.problemSummary.trim(),
      postcode: command.postcode.trim(),
      urgency: command.urgency,
      budgetCents: command.budgetCents,
      preferredWindows: command.preferredWindows.map((item) => item.trim()).filter(Boolean),
      constraints: command.constraints.map((item) => item.trim()).filter(Boolean),
      createdAt: now,
      messages: [
        {
          id: context.id("MSG"),
          actor: "customer",
          kind: "request",
          text: command.problemSummary.trim(),
          createdAt: now,
          revision: 1,
        },
      ],
      offers: [],
      changeOrders: [],
    };
    const next = structuredClone(state);
    next.cases.unshift(serviceCase);
    return {
      state: next,
      result: result({
        ok: true,
        code: "AWAITING_OWNER",
        caseId: id,
        beforeRevision: 0,
        afterRevision: 1,
        effect: `Created service case ${id}.`,
        didNot: ["No appointment was booked.", "No price or arrival time was promised."],
        data: serviceCase,
        nextActions: nextActionsFor(serviceCase),
      }),
    };
  }

  const original = currentCase(state, command.caseId);
  if (!original) return fail(state, "NOT_FOUND", `Service case ${command.caseId} was not found.`);
  const before = original.revision;

  if ("expectedRevision" in command && command.expectedRevision !== before) {
    return fail(
      state,
      "STALE_REVISION",
      `Expected revision ${command.expectedRevision}, but the case is now revision ${before}.`,
      original,
      ["get_service_case"],
    );
  }

  const next = structuredClone(state);
  const serviceCase = currentCase(next, command.caseId)!;
  const now = context.now();

  switch (command.type) {
    case "CUSTOMER_MESSAGE": {
      if (!validText(command.text, 1000) || serviceCase.status === "booking_prepared") {
        return fail(state, "INVALID_STATE", "A customer message is not valid in the current case state.", original);
      }
      serviceCase.revision += 1;
      const detail = [
        command.text.trim(),
        command.proposedBudgetCents !== undefined
          ? `Proposed ceiling: $${(command.proposedBudgetCents / 100).toFixed(2)}.`
          : "",
        command.preferredWindow ? `Preferred window: ${command.preferredWindow}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      serviceCase.messages.push({
        id: context.id("MSG"),
        actor: "customer",
        kind: command.kind,
        text: detail,
        createdAt: now,
        revision: serviceCase.revision,
      });
      serviceCase.status = "negotiating";
      return {
        state: next,
        result: result({
          ok: true,
          code: "AWAITING_OWNER",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: `Added the customer's ${command.kind} to the case.`,
          didNot: ["No offer was accepted.", "No booking was created."],
          data: serviceCase,
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }

    case "STAGE_OWNER_REPLY": {
      if (!validText(command.text, 1000) || serviceCase.status === "booking_prepared") {
        return fail(state, "INVALID_STATE", "The owner reply cannot be staged in the current state.", original);
      }
      serviceCase.ownerDraft = {
        kind: "reply",
        baseRevision: before,
        text: command.text.trim(),
        stagedAt: now,
      };
      return {
        state: next,
        result: result({
          ok: true,
          code: "AWAITING_HUMAN",
          caseId: serviceCase.id,
          beforeRevision: before,
          effect: "Staged an owner reply for review.",
          didNot: ["The customer cannot see the draft.", "The reply was not sent."],
          humanActionRequired: true,
          data: serviceCase.ownerDraft,
          nextActions: ["human_send_staged_owner_reply"],
        }),
      };
    }

    case "SEND_OWNER_REPLY": {
      if (serviceCase.ownerDraft?.kind !== "reply" || serviceCase.ownerDraft.baseRevision !== before) {
        return fail(state, "INVALID_STATE", "There is no current owner reply ready to send.", original);
      }
      const draft = serviceCase.ownerDraft;
      serviceCase.revision += 1;
      serviceCase.messages.push({
        id: context.id("MSG"),
        actor: "owner",
        kind: "owner_reply",
        text: draft.text,
        createdAt: now,
        revision: serviceCase.revision,
      });
      delete serviceCase.ownerDraft;
      return {
        state: next,
        result: result({
          ok: true,
          code: "OK",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: "The human owner sent the staged reply.",
          data: serviceCase,
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }

    case "STAGE_OFFER": {
      if (
        !["awaiting_provider", "negotiating", "offer_available"].includes(serviceCase.status) ||
        command.totalCents <= 0 ||
        command.depositCents < 0 ||
        command.depositCents > command.totalCents ||
        command.warrantyDays < 0 ||
        !validText(command.arrivalWindow, 160) ||
        command.includedScope.length === 0 ||
        Number.isNaN(Date.parse(command.expiresAt)) ||
        Date.parse(command.expiresAt) <= Date.parse(now)
      ) {
        return fail(state, "INVALID_STATE", "The offer cannot be staged with these terms.", original);
      }
      serviceCase.ownerDraft = {
        kind: "offer",
        baseRevision: before,
        totalCents: command.totalCents,
        arrivalWindow: command.arrivalWindow.trim(),
        includedScope: command.includedScope.map((item) => item.trim()).filter(Boolean).slice(0, 10),
        exclusions: command.exclusions.map((item) => item.trim()).filter(Boolean).slice(0, 10),
        depositCents: command.depositCents,
        warrantyDays: command.warrantyDays,
        expiresAt: command.expiresAt,
        stagedAt: now,
      };
      return {
        state: next,
        result: result({
          ok: true,
          code: "AWAITING_HUMAN",
          caseId: serviceCase.id,
          beforeRevision: before,
          effect: "Staged exact offer terms for owner review.",
          didNot: ["The offer was not sent.", "The customer cannot accept the draft."],
          humanActionRequired: true,
          data: serviceCase.ownerDraft,
          nextActions: ["human_send_staged_offer"],
        }),
      };
    }

    case "SEND_OFFER": {
      if (serviceCase.ownerDraft?.kind !== "offer" || serviceCase.ownerDraft.baseRevision !== before) {
        return fail(state, "INVALID_STATE", "There is no current offer ready to send.", original);
      }
      const draft = serviceCase.ownerDraft;
      serviceCase.revision += 1;
      const offer: ServiceOffer = {
        version: (serviceCase.offers.at(-1)?.version ?? 0) + 1,
        totalCents: draft.totalCents,
        currency: "USD",
        arrivalWindow: draft.arrivalWindow,
        includedScope: draft.includedScope,
        exclusions: draft.exclusions,
        depositCents: draft.depositCents,
        warrantyDays: draft.warrantyDays,
        expiresAt: draft.expiresAt,
        sentAt: now,
        revision: serviceCase.revision,
      };
      serviceCase.offers.push(offer);
      serviceCase.messages.push({
        id: context.id("MSG"),
        actor: "owner",
        kind: "status",
        text: `Offer v${offer.version} sent at $${(offer.totalCents / 100).toFixed(2)} for ${offer.arrivalWindow}.`,
        createdAt: now,
        revision: serviceCase.revision,
      });
      serviceCase.status = "offer_available";
      delete serviceCase.ownerDraft;
      delete serviceCase.bookingPreparation;
      return {
        state: next,
        result: result({
          ok: true,
          code: "OK",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: `The human owner sent offer v${offer.version}.`,
          didNot: ["The offer was not accepted.", "No payment was taken."],
          data: offer,
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }

    case "PREPARE_BOOKING": {
      const offer = serviceCase.offers.find((item) => item.version === command.offerVersion);
      const latest = serviceCase.offers.at(-1);
      if (!offer || offer.version !== latest?.version || serviceCase.status !== "offer_available") {
        return fail(state, "INVALID_STATE", "Only the latest sent offer can be prepared for booking.", original);
      }
      if (Date.parse(offer.expiresAt) <= Date.parse(now)) {
        return fail(state, "OFFER_EXPIRED", `Offer v${offer.version} has expired.`, original, ["get_service_case"]);
      }
      serviceCase.revision += 1;
      serviceCase.bookingPreparation = {
        offerVersion: offer.version,
        preparedAt: now,
        revision: serviceCase.revision,
      };
      serviceCase.status = "booking_prepared";
      return {
        state: next,
        result: result({
          ok: true,
          code: "AWAITING_HUMAN",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: `Prepared offer v${offer.version} for visible customer confirmation.`,
          didNot: ["No booking was completed.", "No deposit was charged."],
          humanActionRequired: true,
          data: { offer, preparation: serviceCase.bookingPreparation },
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }

    case "CANCEL_BOOKING_PREPARATION": {
      if (serviceCase.status !== "booking_prepared") {
        return fail(state, "INVALID_STATE", "There is no booking preparation to cancel.", original);
      }
      serviceCase.revision += 1;
      delete serviceCase.bookingPreparation;
      serviceCase.status = "offer_available";
      return {
        state: next,
        result: result({
          ok: true,
          code: "OK",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: "Cancelled the booking preparation.",
          didNot: ["The sent offer remains available until it expires."],
          data: serviceCase,
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }

    case "CONFIRM_BOOKING": {
      if (serviceCase.status !== "booking_prepared" || !serviceCase.bookingPreparation) {
        return fail(state, "INVALID_STATE", "There is no prepared booking for the customer to confirm.", original);
      }
      const offer = serviceCase.offers.find(
        (item) => item.version === serviceCase.bookingPreparation!.offerVersion,
      );
      if (!offer || offer.version !== serviceCase.offers.at(-1)?.version) {
        return fail(state, "INVALID_STATE", "The prepared offer is no longer current.", original);
      }
      if (Date.parse(offer.expiresAt) <= Date.parse(now)) {
        return fail(state, "OFFER_EXPIRED", `Offer v${offer.version} has expired.`, original);
      }
      serviceCase.revision += 1;
      serviceCase.receipt = {
        id: context.id("RCPT"),
        caseId: serviceCase.id,
        simulated: true,
        confirmedAt: now,
        acceptedOffer: structuredClone(offer),
        decisions: [],
      };
      serviceCase.messages.push({
        id: context.id("MSG"),
        actor: "system",
        kind: "status",
        text: `Human confirmed offer v${offer.version}. This is a simulated booking; no payment was taken.`,
        createdAt: now,
        revision: serviceCase.revision,
      });
      delete serviceCase.bookingPreparation;
      serviceCase.status = "booked";
      return {
        state: next,
        result: result({
          ok: true,
          code: "OK",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: `Created simulated booking receipt ${serviceCase.receipt.id}.`,
          didNot: ["No real appointment was made.", "No payment was taken."],
          data: serviceCase.receipt,
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }

    case "STAGE_CHANGE_ORDER": {
      if (
        serviceCase.status !== "booked" ||
        !serviceCase.receipt ||
        !validText(command.reason, 600) ||
        command.addedScope.length === 0 ||
        command.deltaCents <= 0
      ) {
        return fail(state, "INVALID_STATE", "The change order cannot be staged in the current state.", original);
      }
      serviceCase.ownerDraft = {
        kind: "change_order",
        baseRevision: before,
        reason: command.reason.trim(),
        addedScope: command.addedScope.map((item) => item.trim()).filter(Boolean).slice(0, 10),
        removedScope: command.removedScope.map((item) => item.trim()).filter(Boolean).slice(0, 10),
        deltaCents: command.deltaCents,
        scheduleImpact: command.scheduleImpact.trim() || "No stated schedule impact",
        stagedAt: now,
      };
      return {
        state: next,
        result: result({
          ok: true,
          code: "AWAITING_HUMAN",
          caseId: serviceCase.id,
          beforeRevision: before,
          effect: "Staged a change order for owner review.",
          didNot: ["The customer cannot see the draft.", "The accepted booking did not change."],
          humanActionRequired: true,
          data: serviceCase.ownerDraft,
          nextActions: ["human_send_staged_change_order"],
        }),
      };
    }

    case "SEND_CHANGE_ORDER": {
      if (
        serviceCase.status !== "booked" ||
        serviceCase.ownerDraft?.kind !== "change_order" ||
        serviceCase.ownerDraft.baseRevision !== before ||
        !serviceCase.receipt
      ) {
        return fail(state, "INVALID_STATE", "There is no current change order ready to send.", original);
      }
      const draft = serviceCase.ownerDraft;
      serviceCase.revision += 1;
      const changeOrder: ChangeOrder = {
        id: context.id("CO"),
        baseOfferVersion: serviceCase.receipt.acceptedOffer.version,
        reason: draft.reason,
        addedScope: draft.addedScope,
        removedScope: draft.removedScope,
        deltaCents: draft.deltaCents,
        scheduleImpact: draft.scheduleImpact,
        status: "pending",
        sentAt: now,
        revision: serviceCase.revision,
      };
      serviceCase.changeOrders.push(changeOrder);
      serviceCase.messages.push({
        id: context.id("MSG"),
        actor: "owner",
        kind: "status",
        text: `Change order ${changeOrder.id} sent for +$${(changeOrder.deltaCents / 100).toFixed(2)}.`,
        createdAt: now,
        revision: serviceCase.revision,
      });
      serviceCase.status = "change_pending";
      delete serviceCase.ownerDraft;
      return {
        state: next,
        result: result({
          ok: true,
          code: "OK",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: `The human owner sent change order ${changeOrder.id}.`,
          didNot: ["The change order was not accepted.", "The accepted booking snapshot did not change."],
          data: changeOrder,
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }

    case "DECIDE_CHANGE_ORDER": {
      const changeOrder = serviceCase.changeOrders.find((item) => item.id === command.changeOrderId);
      if (serviceCase.status !== "change_pending" || !changeOrder || changeOrder.status !== "pending") {
        return fail(state, "INVALID_STATE", "The change order is not awaiting a decision.", original);
      }
      serviceCase.revision += 1;
      changeOrder.status = command.decision;
      serviceCase.status = "booked";
      serviceCase.receipt?.decisions.push({
        changeOrderId: changeOrder.id,
        decision: command.decision,
        decidedAt: now,
      });
      serviceCase.messages.push({
        id: context.id("MSG"),
        actor: "customer",
        kind: "status",
        text: `Human ${command.decision} change order ${changeOrder.id}.`,
        createdAt: now,
        revision: serviceCase.revision,
      });
      return {
        state: next,
        result: result({
          ok: true,
          code: "OK",
          caseId: serviceCase.id,
          beforeRevision: before,
          afterRevision: serviceCase.revision,
          effect: `The human customer ${command.decision} change order ${changeOrder.id}.`,
          didNot:
            command.decision === "rejected"
              ? ["The accepted booking terms remain unchanged."]
              : ["No real payment was taken."],
          data: changeOrder,
          nextActions: nextActionsFor(serviceCase),
        }),
      };
    }
  }
}

export function compareOfferVersions(serviceCase: ServiceCase, fromVersion: number, toVersion: number) {
  const from = serviceCase.offers.find((offer) => offer.version === fromVersion);
  const to = serviceCase.offers.find((offer) => offer.version === toVersion);
  if (!from || !to) return undefined;
  return {
    fromVersion,
    toVersion,
    priceDeltaCents: to.totalCents - from.totalCents,
    depositDeltaCents: to.depositCents - from.depositCents,
    arrivalWindow: from.arrivalWindow === to.arrivalWindow ? "unchanged" : { from: from.arrivalWindow, to: to.arrivalWindow },
    warrantyDays: from.warrantyDays === to.warrantyDays ? "unchanged" : { from: from.warrantyDays, to: to.warrantyDays },
    scopeAdded: to.includedScope.filter((item) => !from.includedScope.includes(item)),
    scopeRemoved: from.includedScope.filter((item) => !to.includedScope.includes(item)),
    exclusionsAdded: to.exclusions.filter((item) => !from.exclusions.includes(item)),
    exclusionsRemoved: from.exclusions.filter((item) => !to.exclusions.includes(item)),
    expiryChanged: from.expiresAt === to.expiresAt ? "unchanged" : { from: from.expiresAt, to: to.expiresAt },
  };
}

export function compareChangeOrder(serviceCase: ServiceCase, changeOrderId: string) {
  const receipt = serviceCase.receipt;
  const changeOrder = serviceCase.changeOrders.find((item) => item.id === changeOrderId);
  if (!receipt || !changeOrder) return undefined;
  const accepted = receipt.acceptedOffer;
  const words = (value: string) => value.toLowerCase().match(/[a-z0-9]+/g)?.map((word) => word.replace(/s$/, "")) ?? [];
  const excludedWords = new Set(accepted.exclusions.flatMap(words));
  const explicitlyExcluded = changeOrder.addedScope.filter((added) =>
    words(added).some((word) => word.length > 3 && excludedWords.has(word)),
  );
  return {
    changeOrderId,
    baselineOfferVersion: accepted.version,
    originalTotalCents: accepted.totalCents,
    deltaCents: changeOrder.deltaCents,
    proposedTotalCents: accepted.totalCents + changeOrder.deltaCents,
    addedScope: changeOrder.addedScope,
    removedScope: changeOrder.removedScope,
    scheduleImpact: changeOrder.scheduleImpact,
    explicitlyExcluded,
    unresolvedAmbiguity:
      explicitlyExcluded.length === 0
        ? ["The demo cannot determine contractual coverage from free text; a human must review the scope."]
        : [],
    decisionRequired: changeOrder.status === "pending",
    disclaimer: "This deterministic comparison does not decide whether the charge is justified.",
  };
}

const ESTIMATE_ADJUSTMENTS: Record<
  EstimateAccess | KnownFinding | "same_day",
  { label: string; minCents: number; maxCents: number }
> = {
  standard: { label: "Standard equipment access", minCents: 0, maxCents: 0 },
  limited: { label: "Limited equipment access", minCents: 2500, maxCents: 7500 },
  rooftop: { label: "Rooftop access", minCents: 7500, maxCents: 18000 },
  same_day: { label: "Same-day planning allowance", minCents: 0, maxCents: 4000 },
  unknown: { label: "No part finding supplied", minCents: 0, maxCents: 0 },
  capacitor: { label: "Synthetic capacitor part allowance", minCents: 9500, maxCents: 18000 },
  thermostat: { label: "Synthetic thermostat allowance", minCents: 12000, maxCents: 35000 },
  refrigerant: { label: "Synthetic refrigerant-work allowance", minCents: 18000, maxCents: 65000 },
  compressor: { label: "Synthetic compressor-work allowance", minCents: 120000, maxCents: 300000 },
};

export function estimateServiceRange(input: {
  serviceId: string;
  urgency: Urgency;
  access: EstimateAccess;
  knownFinding: KnownFinding;
}) {
  const service = SERVICES.find((item) => item.id === input.serviceId);
  if (!service) return undefined;
  const components = [
    { label: `${service.name} published band`, minCents: service.minCents, maxCents: service.maxCents },
    ESTIMATE_ADJUSTMENTS[input.access],
    ESTIMATE_ADJUSTMENTS[input.knownFinding],
    ...(input.urgency === "same_day" ? [ESTIMATE_ADJUSTMENTS.same_day] : []),
  ];
  return {
    currency: "USD" as const,
    minCents: components.reduce((sum, item) => sum + item.minCents, 0),
    maxCents: components.reduce((sum, item) => sum + item.maxCents, 0),
    components,
    basis: "Fictional Velaire demonstration rate card, not local market data.",
    confidence: input.knownFinding === "unknown" ? "low_until_diagnostic" : "planning_only",
    requiresOnsiteDiagnosis: input.serviceId !== "seasonal-tune-up",
    disclaimer: "This transparent planning range is not an offer, diagnosis, market benchmark, or promise of final price.",
  };
}

export function getProjectPreflight(input: {
  postcode: string;
  projectType: ProjectType;
  buildingType: BuildingType;
  installationLocation: InstallationLocation;
}) {
  const replacement = input.projectType === "equipment_replacement" || input.projectType === "heat_pump_upgrade";
  const heatPump = input.projectType === "heat_pump_upgrade";
  const checklist = [
    "Written scope, exclusions, equipment make and model, and total price",
    "Contractor identity, insurance, and any licence or registration required by the authority",
    "Photos of the existing equipment and access route, with no people or personal documents visible",
    ...(replacement ? ["Load-sizing basis, equipment efficiency certificate, electrical requirements, and disposal plan"] : []),
    ...(heatPump ? ["Utility account eligibility and written incentive pre-approval before ordering equipment"] : []),
    ...(input.installationLocation === "rooftop" ? ["Roof access, structural, landmark, condominium, or owner approval as applicable"] : []),
    ...(input.buildingType !== "single_family" ? ["Property-owner or building-management authorization"] : []),
  ];
  return {
    candidateJurisdiction: input.postcode.startsWith("606") ? "Chicago, Illinois" : "Outside the Chicago demo",
    jurisdictionConfidence: "confirm_exact_address_with_the_local_authority",
    supportedDemoPostcode: SERVICE_POSTCODES.has(input.postcode.trim()),
    projectType: input.projectType,
    checklist,
    officialSources: [
      {
        authority: "City of Chicago Department of Buildings",
        title: "Guide to building permits",
        url: "https://www.chicago.gov/city/en/sites/guide-to-building-permits/home.html",
        status: "confirm_permit_path_before_work",
        checkedAt: "2026-09-03",
        note: "The tool routes to the authority; it does not decide whether a permit is required.",
      },
      {
        authority: "Illinois Environmental Protection Agency",
        title: "Illinois home energy rebate program updates",
        url: "https://epa.illinois.gov/topics/energy/energy-rebates.html",
        status: heatPump ? "program_launch_pending_check_before_purchase" : "not_evaluated_for_this_project",
        checkedAt: "2026-09-03",
        note: "The official page says the state program is not retroactive and program-approved projects are required after launch.",
      },
      {
        authority: "ComEd",
        title: "Heating and cooling incentives and financing",
        url: "https://goelectric.comed.com/incentives-and-financing/",
        status: heatPump ? "possible_utility_discount_confirm_current_terms" : "not_evaluated_for_this_project",
        checkedAt: "2026-09-03",
        note: "Availability and eligibility depend on current program terms and utility service.",
      },
      {
        authority: "ENERGY STAR",
        title: "Federal tax credits for energy efficiency",
        url: "https://www.energystar.gov/about/federal-tax-credits",
        status: heatPump ? "prior_credit_ended_2025_do_not_assume_current" : "not_evaluated_for_this_project",
        checkedAt: "2026-09-03",
        note: "The current official page identifies the prior home-improvement credit period as ending December 31, 2025.",
      },
    ],
    unresolvedQuestions: [
      "Does the exact address fall under Chicago or another local permitting authority?",
      "Does the final scope replace equipment, change electrical service, alter structure, or affect a roof?",
      ...(heatPump ? ["Was incentive eligibility confirmed in writing before equipment purchase or installation?"] : []),
    ],
    disclaimer: "This is a source-linked readiness checklist, not legal, tax, permit, code, or rebate eligibility advice.",
  };
}

export function auditInvoiceAgainstReceipt(serviceCase: ServiceCase, lines: InvoiceLineInput[]) {
  const receipt = serviceCase.receipt;
  if (!receipt) return undefined;
  const acceptedChanges = serviceCase.changeOrders.filter((item) => item.status === "accepted");
  const baseRef = `offer-v${receipt.acceptedOffer.version}`;
  let baseSeen = false;
  const changeRefs = new Set<string>();
  const auditedLines = lines.map((line, index) => {
    if (line.kind === "accepted_offer") {
      const duplicate = baseSeen;
      baseSeen = true;
      const refMatches = line.authorizationRef === baseRef;
      const amountMatches = line.amountCents === receipt.acceptedOffer.totalCents;
      return {
        index,
        ...line,
        status: duplicate ? "duplicate" : !refMatches ? "missing_or_wrong_reference" : amountMatches ? "authorized" : "amount_mismatch",
        expectedRef: baseRef,
        expectedCents: receipt.acceptedOffer.totalCents,
      };
    }
    if (line.kind === "approved_change") {
      const change = acceptedChanges.find((item) => item.id === line.authorizationRef);
      const duplicate = line.authorizationRef ? changeRefs.has(line.authorizationRef) : false;
      if (line.authorizationRef) changeRefs.add(line.authorizationRef);
      return {
        index,
        ...line,
        status: duplicate ? "duplicate" : !change ? "unapproved_or_missing_reference" : line.amountCents === change.deltaCents ? "authorized" : "amount_mismatch",
        expectedCents: change?.deltaCents,
      };
    }
    return {
      index,
      ...line,
      status: "requires_human_review",
      reason: line.kind === "tax_or_required_fee"
        ? "The accepted snapshot does not independently authorize taxes or government fees."
        : "The line is not linked to the accepted offer or a human-approved change order.",
    };
  });
  const authorizedTotalCents = receipt.acceptedOffer.totalCents
    + acceptedChanges.reduce((sum, item) => sum + item.deltaCents, 0);
  const invoiceTotalCents = lines.reduce((sum, item) => sum + item.amountCents, 0);
  const unresolved = auditedLines.filter((item) => item.status !== "authorized");
  return {
    receiptId: receipt.id,
    caseId: serviceCase.id,
    acceptedOfferRef: baseRef,
    authorizedTotalCents,
    invoiceTotalCents,
    deltaFromAuthorizedCents: invoiceTotalCents - authorizedTotalCents,
    allLinesTraceToHumanApproval: unresolved.length === 0 && invoiceTotalCents === authorizedTotalCents,
    auditedLines,
    unresolvedLineIndexes: unresolved.map((item) => item.index),
    disclaimer: "This deterministic audit flags agreement mismatches. It does not determine fraud, tax validity, payment liability, or whether a charge is legally enforceable.",
  };
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppState>;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.cases) && Array.isArray(candidate.audit);
}

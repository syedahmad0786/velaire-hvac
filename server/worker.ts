import {
  initialState,
  runCommand,
  type AppState,
  type AuditEvent,
  type Command,
  type ServiceCase,
  type ToolResult,
} from "../src/domain";

interface D1Result { meta?: { changes?: number } }
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<D1Result>;
}
interface D1Database { prepare(sql: string): D1Statement }
interface Env { DB: D1Database }

type Role = "customer" | "owner";
type CaseRow = {
  id: string;
  state_json: string;
  customer_token_hash: string;
  owner_token_hash: string;
  revision: number;
  storage_version: number;
};

const CUSTOMER_COMMANDS = new Set([
  "CUSTOMER_MESSAGE",
  "SET_SERVICE_LOCATION",
  "PREPARE_BOOKING",
  "CANCEL_BOOKING_PREPARATION",
  "CONFIRM_BOOKING",
  "DECIDE_CHANGE_ORDER",
]);
const OWNER_COMMANDS = new Set([
  "STAGE_OWNER_REPLY",
  "SEND_OWNER_REPLY",
  "STAGE_OFFER",
  "SEND_OFFER",
  "STAGE_CHANGE_ORDER",
  "SEND_CHANGE_ORDER",
]);
const HUMAN_ONLY = new Set([
  "CANCEL_BOOKING_PREPARATION",
  "CONFIRM_BOOKING",
  "DECIDE_CHANGE_ORDER",
  "SEND_OWNER_REPLY",
  "SEND_OFFER",
  "SEND_CHANGE_ORDER",
]);

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function boundedString(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${label} is invalid.`);
  return value.trim();
}

function token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getRow(db: D1Database, caseId: string): Promise<CaseRow | null> {
  return db.prepare(
    "SELECT id, state_json, customer_token_hash, owner_token_hash, revision, storage_version FROM service_cases WHERE id = ?",
  ).bind(caseId).first<CaseRow>();
}

function safeState(state: AppState, role: Role): AppState {
  if (role === "owner") return state;
  const cases = state.cases.map((serviceCase) => {
    const { ownerDraft: _privateDraft, ...safeCase } = serviceCase;
    return safeCase;
  });
  const audit = state.audit.filter((event) => !(
    event.actor.startsWith("owner_") && event.operation.includes("stage_")
  ));
  return { ...state, cases, audit };
}

function resultForState(state: AppState, role: Role, result: ToolResult): ToolResult {
  const safe = safeState(state, role);
  const serviceCase = safe.cases.find((item) => item.id === result.caseId);
  return serviceCase ? { ...result, data: serviceCase } : result;
}

async function authorize(db: D1Database, body: Record<string, unknown>): Promise<{ row: CaseRow; role: Role } | null> {
  const caseId = boundedString(body.caseId, "caseId", 80);
  const accessToken = boundedString(body.accessToken, "accessToken", 180);
  const role = body.role === "customer" || body.role === "owner" ? body.role : undefined;
  if (!role) throw new Error("role is invalid.");
  const row = await getRow(db, caseId);
  if (!row) return null;
  const expected = role === "owner" ? row.owner_token_hash : row.customer_token_hash;
  return await hash(accessToken) === expected ? { row, role } : null;
}

function audit(state: AppState, operation: string, actor: AuditEvent["actor"], result: ToolResult): AppState {
  const event: AuditEvent = {
    id: `AUD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    operation,
    actor,
    code: result.code,
    caseId: result.caseId,
    beforeRevision: result.beforeRevision,
    afterRevision: result.afterRevision,
    effect: result.effect,
    occurredAt: new Date().toISOString(),
  };
  return { ...state, audit: [...state.audit, event].slice(-100) };
}

function missing(): Response {
  return json({
    ok: false,
    code: "NOT_FOUND",
    beforeRevision: 0,
    afterRevision: 0,
    effect: "The service case or capability was not found.",
    didNot: ["No case state changed."],
    humanActionRequired: false,
    nextActions: [],
  }, 404);
}

async function openCase(db: D1Database, body: Record<string, unknown>): Promise<Response> {
  const command = record(body.command) as unknown as Command;
  if (command.type !== "OPEN_CASE") throw new Error("Only OPEN_CASE can create a case.");
  const outcome = runCommand(initialState(), command);
  if (!outcome.result.ok) return json({ result: outcome.result, state: outcome.state });
  const customerToken = token();
  const ownerToken = token();
  const now = new Date().toISOString();
  const next = audit(outcome.state, "velaire_open_service_case", "customer_agent", outcome.result);
  await db.prepare(
    "INSERT INTO service_cases (id, state_json, customer_token_hash, owner_token_hash, revision, storage_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
  ).bind(
    outcome.result.caseId,
    JSON.stringify(next),
    await hash(customerToken),
    await hash(ownerToken),
    outcome.result.afterRevision,
    now,
    now,
  ).run();
  return json({
    result: resultForState(next, "customer", outcome.result),
    state: safeState(next, "customer"),
    capabilities: { customer: customerToken, owner: ownerToken },
  }, 201);
}

async function readCase(db: D1Database, body: Record<string, unknown>): Promise<Response> {
  const auth = await authorize(db, body);
  if (!auth) return missing();
  const state = safeState(JSON.parse(auth.row.state_json) as AppState, auth.role);
  const serviceCase = state.cases.find((item) => item.id === auth.row.id)!;
  return json({
    result: {
      ok: true,
      code: "OK",
      caseId: auth.row.id,
      beforeRevision: serviceCase.revision,
      afterRevision: serviceCase.revision,
      effect: "Read the shared service case without changing it.",
      didNot: ["No case state changed."],
      humanActionRequired: false,
      data: serviceCase,
      nextActions: [],
    },
    state,
  });
}

async function commandCase(db: D1Database, body: Record<string, unknown>): Promise<Response> {
  const human = body.human === true;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const auth = await authorize(db, body);
    if (!auth) return missing();
    const command = record(body.command) as unknown as Command;
    if (!(auth.role === "owner" ? OWNER_COMMANDS : CUSTOMER_COMMANDS).has(command.type)) {
      return json({ error: "This capability cannot run that command." }, 403);
    }
    if (HUMAN_ONLY.has(command.type) && !human) {
      return json({ error: "This command requires the visible human control." }, 403);
    }
    if ("caseId" in command && command.caseId !== auth.row.id) throw new Error("Command caseId does not match the capability.");

    const current = JSON.parse(auth.row.state_json) as AppState;
    const outcome = runCommand(current, command);
    const actor: AuditEvent["actor"] = human
      ? auth.role === "owner" ? "owner_human" : "customer_human"
      : auth.role === "owner" ? "owner_agent" : "customer_agent";
    const operation = `${human ? "human" : "velaire"}_${command.type.toLowerCase()}`;
    const next = audit(outcome.state, operation, actor, outcome.result);
    const update = await db.prepare(
      "UPDATE service_cases SET state_json = ?, revision = ?, storage_version = storage_version + 1, updated_at = ? WHERE id = ? AND storage_version = ?",
    ).bind(JSON.stringify(next), outcome.result.afterRevision, new Date().toISOString(), auth.row.id, auth.row.storage_version).run();
    if ((update.meta?.changes ?? 0) === 1) {
      return json({ result: resultForState(next, auth.role, outcome.result), state: safeState(next, auth.role) });
    }
  }
  return json({ error: "The case changed concurrently. Read it again and retry." }, 409);
}

async function waitForCase(db: D1Database, body: Record<string, unknown>, signal: AbortSignal): Promise<Response> {
  const started = Date.now();
  const afterRevision = Number(body.afterRevision);
  const maxWaitSeconds = Math.max(1, Math.min(15, Number(body.maxWaitSeconds ?? 10)));
  if (!Number.isInteger(afterRevision) || afterRevision < 0) throw new Error("afterRevision is invalid.");

  while (!signal.aborted && Date.now() - started < maxWaitSeconds * 1000) {
    const auth = await authorize(db, body);
    if (!auth) return missing();
    if (auth.row.revision > afterRevision) {
      const state = safeState(JSON.parse(auth.row.state_json) as AppState, auth.role);
      const serviceCase = state.cases.find((item) => item.id === auth.row.id)!;
      return json({
        result: {
          ok: true,
          code: "OK",
          caseId: auth.row.id,
          beforeRevision: afterRevision,
          afterRevision: serviceCase.revision,
          effect: "A newer event is available in the shared case.",
          didNot: ["No case state changed."],
          humanActionRequired: false,
          data: serviceCase,
          nextActions: [],
        },
        state,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  const auth = await authorize(db, body);
  if (!auth) return missing();
  const state = safeState(JSON.parse(auth.row.state_json) as AppState, auth.role);
  const serviceCase = state.cases.find((item) => item.id === auth.row.id)!;
  return json({
    result: {
      ok: true,
      code: "STILL_WAITING",
      caseId: auth.row.id,
      beforeRevision: afterRevision,
      afterRevision: serviceCase.revision,
      effect: `No newer public case event arrived within ${maxWaitSeconds} seconds.`,
      didNot: ["No case state changed.", "The agent is not subscribed after this tool call ends."],
      humanActionRequired: false,
      data: {
        serviceCase,
        cursor: serviceCase.revision,
        nextPollAfterMs: 750,
        maximumCooperativeWaitSeconds: 120,
      },
      nextActions: ["Call this wait tool again with afterRevision set to the returned cursor, until 120 seconds total or the user stops."],
    },
    state,
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST required." }, 405);
  const body = record(await request.json());
  switch (body.action) {
    case "open": return openCase(env.DB, body);
    case "read": return readCase(env.DB, body);
    case "command": return commandCase(env.DB, body);
    case "wait": return waitForCase(env.DB, body, request.signal);
    default: return json({ error: "Unknown action." }, 400);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/cases") return await handleApi(request, env);
      if (url.pathname === "/health") return json({ ok: true, service: "velaire-shared-cases", persistence: "d1" });
      return new Response("Velaire shared case service", { headers: { "content-type": "text/plain; charset=utf-8" } });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Request failed." }, 400);
    }
  },
};

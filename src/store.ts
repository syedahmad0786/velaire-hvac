import {
  initialState,
  isAppState,
  runCommand,
  type AppState,
  type AuditEvent,
  type Command,
  type RuntimeContext,
  type ToolResult,
} from "./domain";

const STORAGE_KEY = "promisediff:v1";
const CHANNEL_NAME = "promisediff:v1";

type Listener = () => void;
type Actor = AuditEvent["actor"];
export type SharedRole = "customer" | "owner";

export type SharedSession = {
  caseId: string;
  accessToken: string;
  role: SharedRole;
};

export function capabilityUrl(origin: string, role: SharedRole | "graph", caseId: string, accessToken: string): string {
  const path = role === "owner" ? "/demo/owner" : role === "graph" ? `/case-graph/${encodeURIComponent(caseId)}` : "/demo/customer";
  const url = new URL(path, origin);
  url.searchParams.set("case", caseId);
  url.searchParams.set("access", accessToken);
  return url.toString();
}

type SharedResponse = {
  result: ToolResult;
  state: AppState;
  capabilities?: { customer: string; owner: string };
};

function loadState(): AppState {
  if (typeof window === "undefined") return initialState();
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    return isAppState(value) ? value : initialState();
  } catch {
    return initialState();
  }
}

function sharedSessionFromUrl(): SharedSession | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get("case");
  const accessToken = params.get("access");
  const pathname = window.location.pathname ?? "";
  const role: SharedRole | undefined = pathname === "/demo/owner"
    ? "owner"
    : pathname === "/demo/customer" || pathname.startsWith("/case-graph/") || pathname.startsWith("/receipt/")
      ? "customer"
      : undefined;
  return caseId && accessToken && role ? { caseId, accessToken, role } : undefined;
}

function liveSharedApiAvailable(): boolean {
  const hostname = typeof window === "undefined" ? "" : window.location.hostname ?? "";
  return Boolean(hostname) && !["localhost", "127.0.0.1"].includes(hostname);
}

export class PromiseDiffStore {
  private state: AppState;
  private listeners = new Set<Listener>();
  private channel?: BroadcastChannel;
  private shared = sharedSessionFromUrl();
  private ownerInviteUrl?: string;

  constructor(seed?: AppState) {
    this.state = seed ? structuredClone(seed) : loadState();
    if (liveSharedApiAvailable() && !this.shared) this.state = initialState();
    if (typeof window !== "undefined" && !liveSharedApiAvailable() && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!isAppState(event.data)) return;
        this.state = event.data;
        this.emit();
      });
    }
  }

  getSnapshot = (): AppState => this.state;

  getSharedSession = (): Readonly<SharedSession> | undefined => this.shared;

  getOwnerInviteUrl = (): string | undefined => {
    if (this.ownerInviteUrl) return this.ownerInviteUrl;
    if (typeof window === "undefined" || !this.shared) return undefined;
    return window.sessionStorage.getItem(`velaire:owner-invite:${this.shared.caseId}`) ?? undefined;
  };

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  dispatch(
    command: Command,
    operation: string,
    actor: Actor,
    context?: RuntimeContext,
  ): ToolResult {
    const outcome = runCommand(this.state, command, context);
    const next = structuredClone(outcome.state);
    const audit: AuditEvent = {
      id: `AUD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      operation,
      actor,
      code: outcome.result.code,
      caseId: outcome.result.caseId,
      beforeRevision: outcome.result.beforeRevision,
      afterRevision: outcome.result.afterRevision,
      effect: outcome.result.effect,
      occurredAt: new Date().toISOString(),
    };
    next.audit = [...next.audit, audit].slice(-100);
    this.commit(next);
    return outcome.result;
  }

  async dispatchShared(command: Command, operation: string, actor: Actor): Promise<ToolResult> {
    if (!liveSharedApiAvailable()) return this.dispatch(command, operation, actor);
    if (command.type === "OPEN_CASE") {
      const payload = await this.callShared({ action: "open", command }) as SharedResponse;
      if (!payload.capabilities || !payload.result.caseId) {
        if (payload.state) this.commit(payload.state);
        return payload.result;
      }
      const caseId = payload.result.caseId;
      const customerUrl = capabilityUrl(window.location.origin, "customer", caseId, payload.capabilities.customer);
      const ownerInviteUrl = capabilityUrl(window.location.origin, "owner", caseId, payload.capabilities.owner);
      this.shared = { caseId, role: "customer", accessToken: payload.capabilities.customer };
      this.ownerInviteUrl = ownerInviteUrl;
      window.sessionStorage.setItem(`velaire:owner-invite:${caseId}`, ownerInviteUrl);
      window.history.replaceState({}, "", customerUrl);
      this.commit(payload.state);
      return {
        ...payload.result,
        data: {
          ...(payload.result.data as object),
          customerUrl,
          ownerInviteUrl,
          caseGraphUrl: capabilityUrl(window.location.origin, "graph", caseId, payload.capabilities.customer),
          sharingInstruction: "Give the private owner invite URL to the owner chat. Do not post it publicly.",
        },
      };
    }
    if (!this.shared || !("caseId" in command) || command.caseId !== this.shared.caseId) {
      const caseId = "caseId" in command && typeof command.caseId === "string" ? command.caseId : undefined;
      return {
        ok: false,
        code: "NOT_FOUND",
        caseId,
        beforeRevision: 0,
        afterRevision: 0,
        effect: "This live page is not authorized for the requested shared case.",
        didNot: ["No browser-local fallback ran.", "No shared case state changed."],
        humanActionRequired: true,
        nextActions: ["Reopen the complete private capability URL for this case and role."],
      };
    }
    const payload = await this.callShared({
      action: "command",
      caseId: this.shared.caseId,
      accessToken: this.shared.accessToken,
      role: this.shared.role,
      command,
      human: actor.endsWith("_human"),
    }) as SharedResponse;
    this.commit(payload.state);
    return payload.result;
  }

  async refreshShared(): Promise<ToolResult | undefined> {
    if (!this.shared || !liveSharedApiAvailable()) return undefined;
    const payload = await this.callShared({ action: "read", ...this.shared }) as SharedResponse;
    this.commit(payload.state);
    return payload.result;
  }

  async waitShared(afterRevision: number, maxWaitSeconds: number, signal?: AbortSignal): Promise<ToolResult | undefined> {
    if (!this.shared || !liveSharedApiAvailable()) return undefined;
    const payload = await this.callShared({
      action: "wait",
      ...this.shared,
      afterRevision,
      maxWaitSeconds: Math.max(1, Math.min(15, maxWaitSeconds)),
    }, signal) as SharedResponse;
    this.commit(payload.state);
    return payload.result;
  }

  startSharedSync(intervalMs = 1500): () => void {
    let stopped = false;
    let timer: number | undefined;
    const poll = async () => {
      if (stopped) return;
      try { await this.refreshShared(); } catch { /* A later poll or explicit read can recover. */ }
      if (!stopped && typeof window !== "undefined") timer = window.setTimeout(poll, intervalMs);
    };
    void poll();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }

  reset(): void {
    this.shared = undefined;
    this.ownerInviteUrl = undefined;
    this.commit(initialState());
  }

  dispose(): void {
    this.channel?.close();
    this.listeners.clear();
  }

  private commit(next: AppState): void {
    this.state = next;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The human workflow remains usable when storage is unavailable.
      }
      window.dispatchEvent(new CustomEvent("promisediff:state", { detail: next }));
    }
    this.channel?.postMessage(next);
    this.emit();
  }

  private async callShared(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Shared case request failed.");
    return payload;
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const promiseDiffStore = new PromiseDiffStore();

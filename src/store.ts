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

function loadState(): AppState {
  if (typeof window === "undefined") return initialState();
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    return isAppState(value) ? value : initialState();
  } catch {
    return initialState();
  }
}

export class PromiseDiffStore {
  private state: AppState;
  private listeners = new Set<Listener>();
  private channel?: BroadcastChannel;

  constructor(seed?: AppState) {
    this.state = seed ? structuredClone(seed) : loadState();
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!isAppState(event.data)) return;
        this.state = event.data;
        this.emit();
      });
    }
  }

  getSnapshot = (): AppState => this.state;

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

  reset(): void {
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

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const promiseDiffStore = new PromiseDiffStore();

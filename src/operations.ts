import { EVIDENCE, SERVICES } from "./domain";

export type SiteSearchScope = "all" | "services" | "policies" | "help";
export type PlanType = "diagnostic" | "repair" | "equipment_replacement" | "heat_pump_upgrade";
export type PlanTaskStatus = "planned" | "ready" | "in_progress" | "done";

export interface ProjectTask {
  id: string;
  title: string;
  owner: "Velaire" | "Customer" | "Inspector";
  startDay: number;
  endDay: number;
  startDate: string;
  endDate: string;
  status: PlanTaskStatus;
  dependsOn: string[];
  proof: string;
}

export interface ProjectPlan {
  id: string;
  revision: number;
  projectType: PlanType;
  startDate: string;
  durationDays: number;
  createdAt: string;
  status: "planning_draft";
  tasks: ProjectTask[];
  disclaimer: string;
}

export interface ToolMetric {
  id: string;
  toolName: string;
  route: string;
  startedAt: string;
  durationMs: number;
  ok: boolean;
  code: string;
  readOnly: boolean;
}

export interface OperationsState {
  plan: ProjectPlan;
  metrics: ToolMetric[];
}

export const MARKET_SERIES = {
  seriesId: "PCU23822X23822X",
  title: "Producer Price Index: Plumbing and HVAC contractors, nonresidential building work",
  publisher: "U.S. Bureau of Labor Statistics",
  distributor: "Federal Reserve Bank of St. Louis (FRED)",
  unit: "Index Dec 2007=100, not seasonally adjusted",
  geography: "United States",
  sourceUrl: "https://fred.stlouisfed.org/series/PCU23822X23822X",
  methodologyUrl: "https://www.bls.gov/ppi/factsheets/producer-price-index-data-for-nonresidential-building-construction-sector-contractors-naics-238.htm",
  checkedAt: "2026-09-03",
  sourceUpdatedAt: "2026-08-13",
  observations: [
    { month: "2025-12", value: 180.452 },
    { month: "2026-01", value: 183.095 },
    { month: "2026-02", value: 183.211 },
    { month: "2026-03", value: 183.274 },
    { month: "2026-04", value: 180.717 },
    { month: "2026-05", value: 182.07 },
    { month: "2026-06", value: 182.603 },
    { month: "2026-07", value: 187.025 },
  ],
  limitation: "This is a national nonresidential contractor output-price index. It is not a Chicago residential quote, a parts price, or proof that a particular offer is fair.",
} as const;

export const SITE_MANIFEST = {
  name: "Velaire Heating & Air",
  description: "A fictional Chicago HVAC service business with a WebMCP-native, versioned agreement room.",
  serviceArea: ["60610", "60613", "60614", "60657"],
  routes: [
    { label: "Service website", path: "/" },
    { label: "Customer service room", path: "/demo/customer?judge=1" },
    { label: "Owner operations desk", path: "/demo/owner" },
    { label: "Planning and agent operations", path: "/demo/operations" },
  ],
  toolGroups: ["site discovery", "service fit", "evidence", "agreement", "market context", "project planning", "agent operations"],
  boundaries: [
    "All business records, offers, reviews, and bookings are synthetic.",
    "No exact address, direct contact identifier, or payment detail is collected.",
    "Agents can read and prepare; only humans send owner commitments or approve customer commitments.",
  ],
} as const;

const HELP_RECORDS = [
  { id: "help-agent", scope: "help", title: "Use Velaire with ChatGPT", summary: "Open the site inside ChatGPT, ask in the same chat, then review any prepared commitment on the page.", path: "/#agent-access", tags: ["agent", "chatgpt", "webmcp", "help"] },
  { id: "help-safety", scope: "help", title: "HVAC emergency boundary", summary: "Gas smell, smoke, sparks, fire, and carbon-monoxide warnings stop the ordinary service workflow.", path: "/demo/customer?judge=1", tags: ["safety", "emergency", "gas", "smoke", "carbon monoxide"] },
  { id: "help-planning", scope: "help", title: "Project planning and market context", summary: "Inspect the dated BLS/FRED cost signal, prepare a 3–10 day delivery plan, and watch WebMCP call health.", path: "/demo/operations", tags: ["chart", "market", "timeline", "kanban", "telemetry"] },
] as const;

export function searchSite(query: string, scope: SiteSearchScope = "all") {
  const records = [
    ...SERVICES.map((service) => ({ id: service.id, scope: "services", title: service.name, summary: service.summary, path: service.canonicalPath, tags: [service.id, "hvac", service.sameDayEligible ? "same day" : "scheduled"] })),
    ...EVIDENCE.map((item) => ({ id: item.id, scope: "policies", title: `${item.topic} evidence`, summary: item.claim, path: item.canonicalPath, tags: [item.topic, item.evidenceType, "policy", "evidence"] })),
    ...HELP_RECORDS,
  ];
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return records
    .filter((item) => scope === "all" || item.scope === scope)
    .map((item) => ({ item, score: terms.reduce((score, term) => score + (`${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 10)
    .map(({ item }) => item);
}

export function getMarketContext(months: number = MARKET_SERIES.observations.length) {
  const observations = MARKET_SERIES.observations.slice(-Math.max(3, Math.min(MARKET_SERIES.observations.length, months)));
  const first = observations[0].value;
  const last = observations.at(-1)!.value;
  return {
    ...MARKET_SERIES,
    observations,
    changePercent: Number((((last - first) / first) * 100).toFixed(2)),
    direction: last > first ? "up" : last < first ? "down" : "flat",
  };
}

export function compareQuoteContext(serviceId: string, quoteCents: number) {
  const service = SERVICES.find((item) => item.id === serviceId);
  if (!service) return undefined;
  const position = quoteCents < service.minCents ? "below_published_velaire_band" : quoteCents > service.maxCents ? "above_published_velaire_band" : "inside_published_velaire_band";
  return {
    service: { id: service.id, name: service.name },
    quoteCents,
    publishedVelaireBand: { minCents: service.minCents, maxCents: service.maxCents, synthetic: true },
    position,
    distanceFromBandCents: quoteCents < service.minCents ? quoteCents - service.minCents : quoteCents > service.maxCents ? quoteCents - service.maxCents : 0,
    nationalCostSignal: getMarketContext(),
    conclusion: "This comparison only checks Velaire's fictional published band. The national index gives directional context and cannot validate this local residential quote.",
  };
}

function datePlus(startDate: string, days: number): string {
  const value = new Date(`${startDate}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function createProjectPlan(input: { projectType: PlanType; startDate: string; durationDays: number }, revision = 1, now = new Date().toISOString()): ProjectPlan {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || Number.isNaN(Date.parse(`${input.startDate}T12:00:00.000Z`))) throw new Error("startDate must be a real date in YYYY-MM-DD format.");
  if (!Number.isInteger(input.durationDays) || input.durationDays < 3 || input.durationDays > 10) throw new Error("durationDays must be an integer from 3 to 10.");
  const middle = Math.max(2, Math.ceil(input.durationDays / 2));
  const commissioning = Math.max(2, input.durationDays - 1);
  const tasks: Array<Omit<ProjectTask, "startDate" | "endDate">> = [
    { id: "scope-lock", title: "Scope, access, and safety lock", owner: "Velaire", startDay: 1, endDay: 1, status: "done", dependsOn: [], proof: "Signed scope checklist" },
    { id: "site-ready", title: "Site readiness and customer access", owner: "Customer", startDay: 2, endDay: 2, status: "in_progress", dependsOn: ["scope-lock"], proof: "Access window confirmed" },
    { id: "core-work", title: input.projectType === "diagnostic" ? "Instrumented diagnostic" : input.projectType === "repair" ? "Approved repair work" : "Equipment installation", owner: "Velaire", startDay: middle, endDay: commissioning, status: "ready", dependsOn: ["site-ready"], proof: "Technician work record" },
    { id: "commission", title: "Commissioning and performance checks", owner: "Velaire", startDay: commissioning, endDay: commissioning, status: "planned", dependsOn: ["core-work"], proof: "Commissioning readings" },
    { id: "handoff", title: "Customer walkthrough and closeout", owner: "Customer", startDay: input.durationDays, endDay: input.durationDays, status: "planned", dependsOn: ["commission"], proof: "Human-approved completion receipt" },
  ];
  return {
    id: `PLAN-${input.projectType.toUpperCase().replaceAll("_", "-")}-${input.startDate}`,
    revision,
    projectType: input.projectType,
    startDate: input.startDate,
    durationDays: input.durationDays,
    createdAt: now,
    status: "planning_draft",
    tasks: tasks.map((task) => ({ ...task, startDate: datePlus(input.startDate, task.startDay - 1), endDate: datePlus(input.startDate, task.endDay - 1) })),
    disclaimer: "This is a synthetic planning draft, not a promised appointment, crew assignment, inspection result, or completion date.",
  };
}

const STORAGE_KEY = "velaire:operations:v1";
const defaultPlan = () => createProjectPlan({ projectType: "heat_pump_upgrade", startDate: "2026-09-08", durationDays: 7 }, 1, "2026-09-03T00:00:00.000Z");

function loadState(): OperationsState {
  if (typeof window === "undefined") return { plan: defaultPlan(), metrics: [] };
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<OperationsState> | null;
    const saved = value?.plan;
    const planTypes: PlanType[] = ["diagnostic", "repair", "equipment_replacement", "heat_pump_upgrade"];
    const plan = saved && planTypes.includes(saved.projectType) && Number.isInteger(saved.revision)
      ? createProjectPlan({ projectType: saved.projectType, startDate: saved.startDate, durationDays: saved.durationDays }, saved.revision, saved.createdAt)
      : defaultPlan();
    const metrics = Array.isArray(value?.metrics) ? value.metrics.filter((item) => item && typeof item.toolName === "string" && typeof item.durationMs === "number" && typeof item.code === "string").slice(-200) : [];
    return { plan, metrics };
  } catch {
    return { plan: defaultPlan(), metrics: [] };
  }
}

type Listener = () => void;

class OperationsStore {
  private state = loadState();
  private listeners = new Set<Listener>();

  getSnapshot = () => this.state;
  subscribe = (listener: Listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };

  preparePlan(input: { projectType: PlanType; startDate: string; durationDays: number; expectedRevision: number }): { ok: boolean; plan: ProjectPlan; error?: string } {
    if (input.expectedRevision !== this.state.plan.revision) return { ok: false, plan: this.state.plan, error: `Expected plan revision ${input.expectedRevision}, but it is now ${this.state.plan.revision}.` };
    const plan = createProjectPlan(input, this.state.plan.revision + 1);
    this.commit({ ...this.state, plan });
    return { ok: true, plan };
  }

  recordMetric(metric: Omit<ToolMetric, "id">): void {
    const entry = { ...metric, id: `CALL-${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
    this.commit({ ...this.state, metrics: [...this.state.metrics, entry].slice(-200) });
  }

  clearMetrics(): void {
    this.commit({ ...this.state, metrics: [] });
  }

  private commit(next: OperationsState): void {
    this.state = next;
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* dashboard remains live without persistence */ }
    }
    this.listeners.forEach((listener) => listener());
  }
}

export const operationsStore = new OperationsStore();

export function summarizeMetrics(metrics: ToolMetric[]) {
  const sorted = metrics.map((item) => item.durationMs).sort((a, b) => a - b);
  const percentile = sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] : 0;
  return {
    totalCalls: metrics.length,
    successfulCalls: metrics.filter((item) => item.ok).length,
    successRate: metrics.length ? Number(((metrics.filter((item) => item.ok).length / metrics.length) * 100).toFixed(1)) : 100,
    averageLatencyMs: metrics.length ? Math.round(metrics.reduce((sum, item) => sum + item.durationMs, 0) / metrics.length) : 0,
    p95LatencyMs: percentile,
    readCalls: metrics.filter((item) => item.readOnly).length,
    actionCalls: metrics.filter((item) => !item.readOnly).length,
    latestCalls: metrics.slice(-20).reverse(),
    scope: "Browser-local WebMCP handler timing. It excludes model reasoning, network transport, and registration time.",
  };
}

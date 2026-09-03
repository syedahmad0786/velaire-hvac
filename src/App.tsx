import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import {
  EVIDENCE,
  SERVICES,
  compareChangeOrder,
  compareOfferVersions,
  type AuditEvent,
  type EvidenceTopic,
  type ServiceCase,
  type ServiceOffer,
} from "./domain";
import { promiseDiffStore } from "./store";
import { caseVisuals } from "./case-visuals";
import { installWebMCP, type ToolRoute, type WebMCPStatus } from "./webmcp";
import {
  getMarketContext,
  operationsStore,
  summarizeMetrics,
  type PlanTaskStatus,
  type PlanType,
} from "./operations";

function usePromiseDiffState() {
  return useSyncExternalStore(promiseDiffStore.subscribe, promiseDiffStore.getSnapshot, promiseDiffStore.getSnapshot);
}

function useOperationsState() {
  return useSyncExternalStore(operationsStore.subscribe, operationsStore.getSnapshot, operationsStore.getSnapshot);
}

function routeKind(pathname: string): ToolRoute {
  if (pathname === "/") return "customer";
  if (pathname === "/demo/customer") return "customer";
  if (pathname === "/demo/owner") return "owner";
  if (pathname === "/demo/operations") return "operations";
  if (pathname.startsWith("/case-graph/")) return "customer";
  if (pathname.startsWith("/evidence/")) return "evidence";
  if (pathname.startsWith("/receipt/")) return "receipt";
  return "none";
}

function useWebMCP(route: ToolRoute) {
  const [status, setStatus] = useState<WebMCPStatus | null>(null);
  useEffect(() => {
    let active = true;
    let dispose = () => {};
    installWebMCP(promiseDiffStore, route).then((next) => {
      dispose = next.dispose;
      if (active) setStatus(next);
    });
    return () => {
      active = false;
      dispose();
    };
  }, [route]);
  return status;
}

function useSharedCaseSync() {
  useEffect(() => promiseDiffStore.startSharedSync(), []);
}

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const shortTime = (value: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const capabilityLabel = (value: string) => titleCase(value.replace(/^velaire_/, ""));

function Logo() {
  return <a className="logo" href="/" aria-label="Velaire Heating and Air home">
    <span className="logo-mark" aria-hidden="true"><img src="/assets/velaire-mark.webp" alt="" /></span>
    <span className="logo-type"><strong>Velaire</strong><small>Heating &amp; Air</small></span>
  </a>;
}

function Shell({ children, status }: { children: ReactNode; status: WebMCPStatus | null }) {
  const agentStatus = status === null
    ? "Checking assistant access"
    : status.supported
      ? "AI assistance ready"
      : "Use with ChatGPT";
  return <>
    <header className="topbar">
      <Logo />
      <nav aria-label="Primary navigation">
        <a href="/#services">Services</a>
        <a href="/#agent-access">Use with ChatGPT</a>
        <a href="/demo/customer?judge=1">Service room</a>
        <a href="/demo/operations">Service insights</a>
        <a href="/demo/owner">Owner portal</a>
      </nav>
      <a className={`mcp-indicator ${status?.supported ? "is-live" : ""}`} href="/#agent-access" title={status?.errors.join("\n") || undefined}>
        <span aria-hidden="true" />
        {agentStatus}
      </a>
    </header>
    {children}
    <footer><Logo /><p>Precision comfort. Clearly agreed.</p><span>Fictional Chicago service experience</span></footer>
  </>;
}

function SyntheticFlag() {
  return <span className="synthetic-flag">Fictional demo</span>;
}

function EvidenceIcon({ topic }: { topic: EvidenceTopic }) {
  let body: ReactNode;
  switch (topic) {
    case "credentials": body = <><path d="M12 3 5 6v5c0 4.6 2.7 8.1 7 10 4.3-1.9 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></>; break;
    case "pricing": body = <><path d="M20 13 13 20 4 11V4h7l9 9Z" /><circle cx="8.5" cy="8.5" r="1" /><path d="M14.5 10.5c-2-1.2-4 .1-4 1.5 0 2 4 1 4 3 0 1.4-2 2.7-4 1.5M12.5 9v9" /></>; break;
    case "availability": body = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="M7 3.8 5.5 2.5M17 3.8l1.5-1.3" /></>; break;
    case "cancellation": body = <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M9 14l6 4M15 14l-6 4" /></>; break;
    case "warranty": body = <><path d="m12 3 2 2.1 2.9-.2.8 2.8 2.5 1.5-1.1 2.7 1.1 2.7-2.5 1.5-.8 2.8-2.9-.2L12 21l-2-2.1-2.9.2-.8-2.8-2.5-1.5 1.1-2.7-1.1-2.7 2.5-1.5.8-2.8 2.9.2L12 3Z" /><path d="m9 12 2 2 4-5" /></>; break;
    case "reviews": body = <><path d="M5 5h14v11H9l-4 4V5Z" /><path d="m12 8 .9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3L12 8Z" /></>; break;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{body}</svg>;
}

const STARTER_PROMPT = "My AC is blowing warm air in 60614 and I can spend up to $180. Check whether Velaire can help today, show me the evidence and a transparent price range, then open a service case using Lincoln Park, Chicago, IL 60614 as my confirmed synthetic location. Show me how long the drive may take and give me the map routes. Do not approve a booking or changed work for me.";

function AgentGuide({ status, serviceCase, compact = false, role = "customer" }: { status: WebMCPStatus | null; serviceCase?: ServiceCase; compact?: boolean; role?: "customer" | "owner" }) {
  const [copyLabel, setCopyLabel] = useState("Copy message");
  const prompt = serviceCase
    ? role === "owner"
      ? `Act as Velaire's owner assistant for shared service case ${serviceCase.id}. Read the current case, prepare the next appropriate reply or structured offer, and ask me to review and press the visible Send button. After I send it, keep checking for a customer reply in short rounds for no more than two minutes. Never send or approve on my behalf.`
      : `Act as my customer assistant for shared service case ${serviceCase.id}. Read the latest case, summarize anything new, and show the visual case history. If my location is confirmed, show the driving route and a clearly labeled arrival planning range. If you send a question or counteroffer, keep checking for the owner's reply in short rounds for no more than two minutes. Stop before every confirmation, payment, booking, or changed-work decision.`
    : STARTER_PROMPT;
  const connected = status?.supported === true;
  const headline = status === null
    ? "Checking whether your AI agent can use this page…"
    : connected
      ? "Ask in your ChatGPT chat. Velaire is ready."
      : "Open this page in ChatGPT, then ask in that chat.";
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyLabel("Copied to clipboard");
    } catch {
      setCopyLabel("Select the message, then copy");
    }
  };

  return <aside id={compact ? undefined : "agent-access"} className={`agent-guide ${compact ? "compact" : ""}`} aria-label="Use Velaire with your AI agent">
    <div className="agent-guide-status">
      <span className={connected ? "live-orb" : "standby-orb"} aria-hidden="true" />
      <div><span>USE YOUR AI ASSISTANT</span><strong>{connected ? "Connected to this page" : "Works with ChatGPT"}</strong></div>
      <em>{connected ? "READY" : "NO MANUAL SETUP"}</em>
    </div>
    <div className="agent-guide-body">
      <div className="agent-guide-instructions">
        <h2>{headline}</h2>
        <p>Describe what you need in your current ChatGPT conversation. Your assistant can check Velaire’s services and prepare the next step while you keep control of every decision.</p>
        <ol aria-label="How to use the AI agent">
          <li><span>1</span><b>Open this page in ChatGPT</b></li>
          <li><span>2</span><b>Ask in the same chat</b></li>
          <li><span>3</span><b>Review and approve here</b></li>
        </ol>
        {serviceCase && <a className="active-case-link" href={`/demo/customer?case=${serviceCase.id}&judge=1`}><span>ACTIVE CASE</span><b>{serviceCase.id} · revision {serviceCase.revision}</b></a>}
      </div>
      <div className="agent-prompt-panel">
        <label htmlFor={`agent-prompt-${compact ? "desk" : "home"}`}>Message to send in your ChatGPT chat</label>
        <textarea id={`agent-prompt-${compact ? "desk" : "home"}`} value={prompt} readOnly rows={compact ? 4 : 6} onFocus={(event) => event.currentTarget.select()} />
        <div className="agent-guide-actions">
          <button className="button copper" type="button" onClick={copyPrompt}>{copyLabel}</button>
          {!compact && <a href="/demo/customer?judge=1">Open service room <span aria-hidden="true">→</span></a>}
        </div>
      </div>
    </div>
    <small className="agent-boundary">The agent can read and prepare. Only you can approve a booking or changed work.</small>
  </aside>;
}

function Landing({ status }: { status: WebMCPStatus | null }) {
  const state = usePromiseDiffState();
  const activeCase = state.cases[0];
  return <main className="service-site">
    <section className="service-hero">
      <img className="hero-photo" src="/assets/velaire-hero.webp" alt="HVAC technician measuring airflow in a Chicago home" />
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow light">Chicago home comfort · same-day requests</p>
          <h1>Comfort without<br />the fine print.</h1>
          <p className="lede">Expert heating and cooling service with published ranges, written terms, and your approval before anything changes.</p>
          <div className="button-row">
            <a className="button primary" href="#agent-access">Use with my AI agent <span aria-hidden="true">→</span></a>
            <a className="button glass" href="/demo/customer?judge=1">Request service myself</a>
          </div>
          <div className="hero-trust" aria-label="Service assurances">
            <span><b>01</b> Published price bands</span>
            <span><b>02</b> Human-approved work</span>
            <span><b>03</b> Written change orders</span>
          </div>
        </div>
        <AgentGuide status={status} serviceCase={activeCase} />
      </div>
      <div className="hero-service-strip">
        <span><b>Service area</b> 60610 · 60613 · 60614 · 60657</span>
        <span><b>Cooling diagnostic</b> from $89</span>
        <span><b>Same-day</b> requests considered</span>
      </div>
    </section>

    <section className="service-section services-showcase" id="services">
      <div className="section-heading"><div><p className="eyebrow">Considered care, clearly priced</p><h2>Home comfort,<br />handled properly.</h2></div><p>Every visit begins with a defined scope. Every additional charge arrives as a separate decision—not a surprise on the invoice.</p></div>
      <div className="premium-service-grid">{SERVICES.map((service, index) => <article key={service.id}>
        <span className="service-number">0{index + 1}</span>
        <div className="service-line" aria-hidden="true" />
        <h3>{service.name}</h3>
        <p>{service.summary}</p>
        <div><strong>{money(service.minCents)}–{money(service.maxCents)}</strong><span>{service.sameDayEligible ? "Same-day eligible" : "Scheduled care"}</span></div>
      </article>)}</div>
    </section>

    <section className="clarity-section">
      <figure><img src="/assets/velaire-agreement.webp" alt="Technician reviewing written service terms with a homeowner" /><figcaption><span>THE VELAIRE STANDARD</span><b>Nothing changes without a conversation.</b></figcaption></figure>
      <div className="clarity-copy"><p className="eyebrow light">Clarity is part of the service</p><h2>You should know exactly what you are approving.</h2><p>Our service room keeps the request, offer, scope, exclusions, timing, and every later change in one versioned record.</p>
        <ol>{[
          ["Before the visit", "Check service area, realistic price bands, policies, and availability rules."],
          ["Before booking", "Compare offer versions and confirm the exact scope yourself."],
          ["Before added work", "See the price and scope difference against the promise you accepted."],
        ].map(([title, copy], index) => <li key={title}><span>0{index + 1}</span><div><b>{title}</b><p>{copy}</p></div></li>)}</ol>
      </div>
    </section>

    <section className="service-section evidence-feature">
      <div className="section-heading compact"><div><p className="eyebrow">Proof before persuasion</p><h2>Policies your agent can actually inspect.</h2></div><p>Each claim carries a canonical source, publisher, freshness date, and honest trust label.</p></div>
      <EvidenceCards />
    </section>

    <section className="operations-preview">
      <div><p className="eyebrow light">Evidence becomes operations</p><h2>From price signal<br />to proof of work.</h2><p>Agents can inspect the values behind a sourced market chart, prepare a 3–10 day delivery plan, and expose every tool result and handler latency on one visible board.</p><a className="button copper" href="/demo/operations">Open agent operations <span aria-hidden="true">→</span></a></div>
      <div className="operations-preview-visual" aria-hidden="true"><span>HVAC CONTRACTOR INDEX · BLS/FRED</span><svg viewBox="0 0 440 170"><path d="M8 131 L67 88 L126 86 L185 85 L244 127 L303 105 L362 96 L432 24" /><line x1="8" y1="145" x2="432" y2="145" /><line x1="8" y1="15" x2="8" y2="145" /></svg><div><b>180.452</b><i>DEC 2025</i><strong>+3.64%</strong><i>JUL 2026</i><b>187.025</b></div></div>
    </section>

    <section className="agent-native-section">
      <div><p className="eyebrow light">Service that keeps its context</p><h2>Your assistant can help without taking over.</h2><p>Keep Velaire open in ChatGPT and describe what you need. Your assistant can check fit, explain a price range, find dated permit and incentive sources, carry a counteroffer, and compare a later invoice with the terms you actually approved.</p><a className="button copper" href="#agent-access">See how to ask <span aria-hidden="true">↑</span></a></div>
      <div className="tool-proof" aria-label="Service assurance model"><div><strong>01</strong><span>Evidence linked</span></div><div><strong>02</strong><span>Terms versioned</span></div><div><strong>03</strong><span>Approval stays yours</span></div><p>Published facts <i>→</i> one shared service case <i>→</i> <b>your decision</b></p></div>
    </section>

    <section className="closing-cta"><SyntheticFlag /><p className="eyebrow">A clearer service journey</p><h2>Warm air today?<br />Ask. Compare. Approve.</h2><a className="button primary" href="#agent-access">Use Velaire with ChatGPT <span aria-hidden="true">↑</span></a><small>No payment, real booking, or personal contact details are collected in this demonstration.</small></section>
  </main>;
}

function EvidenceCards({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "evidence-list compact" : "evidence-list"}>
    {EVIDENCE.map((card) => <a href={card.canonicalPath} className="evidence-card" data-topic={card.topic} key={card.id} aria-label={`Open ${card.topic} source card`}>
      <span className="evidence-icon"><EvidenceIcon topic={card.topic} /></span>
      <span className="evidence-copy"><b>{titleCase(card.topic)}</b>{!compact && <p>{card.claim}</p>}<small><i>{card.evidenceType.replaceAll("_", " ")}</i><i>Refreshed {new Date(card.refreshedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</i><i>Synthetic source</i></small></span>
      <span className="evidence-arrow" aria-hidden="true">↗</span>
    </a>)}
  </div>;
}

function MarketPanel({ compact = false }: { compact?: boolean }) {
  const market = getMarketContext();
  const values = market.observations.map((item) => item.value);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const points = market.observations.map((item, index) => {
    const x = 42 + (index / (market.observations.length - 1)) * 676;
    const y = 225 - ((item.value - min) / (max - min)) * 175;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return <section id="market" className={`market-panel ${compact ? "compact" : ""}`}>
    <header><div><p className="eyebrow">Official national cost signal</p><h2>{compact ? "Context behind the price" : "A market signal your agent can inspect."}</h2></div><div className="market-delta"><span>{market.observations[0].month} → {market.observations.at(-1)!.month}</span><strong>+{market.changePercent}%</strong></div></header>
    {!compact && <div className="market-chart-wrap"><svg className="market-chart" viewBox="0 0 760 270" role="img" aria-labelledby="market-chart-title market-chart-desc"><title id="market-chart-title">BLS producer price index for plumbing and HVAC contractors</title><desc id="market-chart-desc">The national nonresidential contractor index rises from {market.observations[0].value} in {market.observations[0].month} to {market.observations.at(-1)!.value} in {market.observations.at(-1)!.month}, with a dip in April 2026.</desc><line x1="42" y1="225" x2="718" y2="225" /><line x1="42" y1="40" x2="42" y2="225" /><line className="grid-line" x1="42" y1="132" x2="718" y2="132" /><polyline points={points} />{market.observations.map((item, index) => { const [x, y] = points.split(" ")[index].split(","); return <g key={item.month}><circle cx={x} cy={y} r="5" /><text x={x} y="250" textAnchor="middle">{item.month.slice(5)}</text></g>; })}</svg><div className="chart-values" aria-label="Underlying market chart values">{market.observations.map((item) => <span key={item.month}><b>{item.month}</b><strong>{item.value.toFixed(3)}</strong></span>)}</div></div>}
    <div className="market-source"><div><span>SERIES</span><b>{market.seriesId}</b></div><div><span>SCOPE</span><b>U.S. · nonresidential · contractor output</b></div><div><span>SOURCE UPDATED</span><b>{market.sourceUpdatedAt}</b></div></div>
    <p className="market-warning"><strong>Do not read this as a quote.</strong> {market.limitation}</p>
    <div className="source-links"><a href={market.sourceUrl} target="_blank" rel="noreferrer">Open FRED series ↗</a><a href={market.methodologyUrl} target="_blank" rel="noreferrer">Read BLS methodology ↗</a>{compact && <a href="/demo/operations#market">Inspect chart values →</a>}</div>
  </section>;
}

const PLAN_COLUMNS: Array<{ status: PlanTaskStatus; label: string }> = [
  { status: "planned", label: "Planned" }, { status: "ready", label: "Ready" },
  { status: "in_progress", label: "In progress" }, { status: "done", label: "Proof complete" },
];

function ProjectPlanner() {
  const { plan } = useOperationsState();
  const [message, setMessage] = useState("Planning draft only · no dates are promised");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const result = operationsStore.preparePlan({
        projectType: String(data.get("projectType")) as PlanType,
        startDate: String(data.get("startDate")),
        durationDays: Number(data.get("durationDays")),
        expectedRevision: plan.revision,
      });
      setMessage(result.ok ? `Plan revision ${result.plan.revision} is now visible to people and agents.` : result.error ?? "Plan changed; refresh and retry.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Plan input was invalid."); }
  };
  const grid = { gridTemplateColumns: `minmax(150px, 1.5fr) repeat(${plan.durationDays}, minmax(44px, 1fr))` };
  return <section id="project" className="project-board">
    <header><div><p className="eyebrow light">Inspectable delivery plan</p><h2>Plan the work.<br />Keep the promise separate.</h2></div><form key={plan.revision} onSubmit={submit}><label>Project<select name="projectType" defaultValue={plan.projectType}><option value="diagnostic">Diagnostic</option><option value="repair">Repair</option><option value="equipment_replacement">Equipment replacement</option><option value="heat_pump_upgrade">Heat-pump upgrade</option></select></label><label>Start<input name="startDate" type="date" defaultValue={plan.startDate} required /></label><label>Days<input name="durationDays" type="number" min={3} max={10} defaultValue={plan.durationDays} required /></label><button className="button copper" type="submit">Prepare plan</button></form></header>
    <div className="plan-meta"><span><b>{plan.id}</b> · revision {plan.revision}</span><span role="status">{message}</span></div>
    <div className="plan-timeline" aria-label={`${plan.durationDays}-day project timeline`}><div className="timeline-grid timeline-head" style={grid}><b>Workstream</b>{Array.from({ length: plan.durationDays }, (_, index) => <span key={index}>D{index + 1}</span>)}</div>{plan.tasks.map((task) => <div className="timeline-grid timeline-task" style={grid} key={task.id}><b><span>{task.owner}</span>{task.title}</b><i className={`task-bar ${task.status}`} style={{ gridColumn: `${task.startDay + 1} / ${task.endDay + 2}` }}>{task.proof}</i></div>)}</div>
    <div className="kanban" aria-label="Project task board">{PLAN_COLUMNS.map((column) => <section key={column.status}><header><b>{column.label}</b><span>{plan.tasks.filter((task) => task.status === column.status).length}</span></header>{plan.tasks.filter((task) => task.status === column.status).map((task) => <article key={task.id}><small>D{task.startDay}{task.endDay !== task.startDay ? `–D${task.endDay}` : ""} · {task.owner}</small><strong>{task.title}</strong><p>{task.proof}</p>{task.dependsOn.length > 0 && <em>After {task.dependsOn.join(", ")}</em>}</article>)}</section>)}</div>
    <p className="project-disclaimer">{plan.disclaimer}</p>
  </section>;
}

function ObservabilityPanel() {
  const { metrics } = useOperationsState();
  const summary = summarizeMetrics(metrics);
  return <section id="observability" className="observability-panel">
    <header><div><p className="eyebrow">Assistant activity</p><h2>Every request leaves a pulse.</h2><p>Privacy-safe telemetry records the capability used, page, result, and response time. Your request details and results are never logged here.</p></div><button className="button quiet" type="button" onClick={() => operationsStore.clearMetrics()}>Clear local metrics</button></header>
    <div className="metric-grid"><article><span>Calls</span><strong>{summary.totalCalls}</strong><small>last 200</small></article><article><span>Success</span><strong>{summary.successRate}%</strong><small>{summary.successfulCalls}/{summary.totalCalls || 0} returned ok</small></article><article><span>Average</span><strong>{summary.averageLatencyMs}<i>ms</i></strong><small>handler only</small></article><article><span>P95</span><strong>{summary.p95LatencyMs}<i>ms</i></strong><small>browser-local</small></article><article><span>Read / action</span><strong>{summary.readCalls}<i>/</i>{summary.actionCalls}</strong><small>declared intent</small></article></div>
    <div className="call-ledger"><div className="call-ledger-head"><b>Recent request</b><b>Page</b><b>Result</b><b>Response</b><b>Time</b></div>{summary.latestCalls.length ? summary.latestCalls.map((call) => <div className="call-row" key={call.id}><code>{capabilityLabel(call.toolName)}</code><span>{call.route}</span><b className={call.ok ? "call-ok" : "call-error"}>{call.code}</b><span>{call.durationMs.toFixed(2)} ms</span><time dateTime={call.startedAt}>{new Date(call.startedAt).toLocaleTimeString()}</time></div>) : <p>Ask your assistant about Velaire in this ChatGPT conversation; its activity will appear here.</p>}</div>
    <small className="metrics-scope">{summary.scope}</small>
  </section>;
}

function OperationsPage({ status }: { status: WebMCPStatus | null }) {
  const [copyLabel, setCopyLabel] = useState("Copy agent task");
  const prompt = "What public pricing context does Velaire show, and how does a $175 cooling diagnostic compare with its own published range? Prepare a seven-day heat-pump-upgrade work plan starting September 8, 2026, then show me how well this website's assistant capabilities have been performing. Explain every source limitation. Do not book, approve, or pay for anything.";
  return <main className="operations-page">
    <div className="operations-hero"><div><p className="eyebrow light">Velaire service intelligence · synthetic demo</p><h1>The service plan<br />has receipts, too.</h1><p>One shared surface for sourced market context, inspectable project delivery, and live assistant performance.</p></div><aside><span className={status?.supported ? "live-orb" : "standby-orb"} /><b>{status?.supported ? "Your assistant is connected to this page" : "Open this page in ChatGPT for assistance"}</b><label htmlFor="operations-prompt">Ask in this ChatGPT chat</label><textarea id="operations-prompt" value={prompt} readOnly rows={6} onFocus={(event) => event.currentTarget.select()} /><button className="button copper" onClick={async () => { try { await navigator.clipboard.writeText(prompt); setCopyLabel("Copied"); } catch { setCopyLabel("Select and copy"); } }}>{copyLabel}</button><small>Your assistant can inspect and prepare. It cannot approve or commit work.</small></aside></div>
    <MarketPanel />
    <ProjectPlanner />
    <ObservabilityPanel />
  </main>;
}

function RequestForm() {
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await promiseDiffStore.dispatchShared({
        type: "OPEN_CASE",
        serviceId: String(data.get("serviceId")),
        problemSummary: String(data.get("problemSummary")),
        postcode: String(data.get("postcode")),
        urgency: "same_day",
        budgetCents: Number(data.get("budgetDollars")) * 100,
        preferredWindows: ["Today, 2–4 PM"],
        constraints: ["No surprise travel fee", "Approval required before additional work"],
        serviceLocation: String(data.get("serviceLocation")),
        locationPrecision: String(data.get("locationPrecision")) as "area" | "address",
        locationConsentConfirmed: data.get("locationConsent") === "on",
      }, "human_open_service_case", "customer_human");
      if (result.caseId && !promiseDiffStore.getSharedSession()) {
        window.history.replaceState({}, "", `/demo/customer?case=${encodeURIComponent(result.caseId)}&judge=1`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open the shared case.");
    }
  };
  return <form className="request-form" onSubmit={submit}>
    <div className="form-heading"><span>NEW REQUEST</span><SyntheticFlag /></div>
    <label>Service<select name="serviceId" defaultValue="ac-diagnostic">{SERVICES.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select></label>
    <label>What is happening?<textarea name="problemSummary" rows={3} defaultValue="AC is blowing warm air. I need same-day service." maxLength={800} required /></label>
    <div className="form-grid">
      <label>Postcode<input name="postcode" defaultValue="60614" maxLength={12} required /></label>
      <label>Budget ceiling ($)<input name="budgetDollars" type="number" min={0} max={100000} defaultValue={180} required /></label>
    </div>
    <div className="form-grid location-fields"><label>Service address or area<input name="serviceLocation" defaultValue="Lincoln Park, Chicago, IL 60614" maxLength={240} required /></label><label>Location detail<select name="locationPrecision" defaultValue="area"><option value="area">Neighbourhood / area</option><option value="address">Street address</option></select></label></div>
    <label className="consent-check"><input name="locationConsent" type="checkbox" defaultChecked required /><span>I confirm this synthetic location can be shared with the owner case and returned in map-route links.</span></label>
    <div className="constraint-note"><b>Shared with owner</b><span>Today 2–4 PM · No surprise travel fee · Approval before changed work</span></div>
    <button className="button primary full" type="submit">Open service case <span aria-hidden="true">→</span></button>
    {error && <p className="form-error" role="alert">{error}</p>}
    <small>Fictional demo data only. Do not enter real contact or payment information.</small>
  </form>;
}

function Storefront() {
  return <>
    <div className="storefront-heading">
      <div><p className="eyebrow">Velaire Heating &amp; Air · Chicago</p><h1>Clear terms. Comfortable homes.</h1><p>Published ranges, versioned offers, and approval before additional work.</p></div>
      <div className="availability-stamp"><span>AREA</span><strong>60614</strong><small>Same-day requests considered</small></div>
    </div>
    <div className="customer-start-grid">
      <section>
        <h2 className="section-label">Choose a service</h2>
        <div className="service-cards">{SERVICES.map((service) => <article key={service.id}>
          <div><span className="service-code">{service.id.toUpperCase()}</span>{service.sameDayEligible && <span className="same-day">same day</span>}</div>
          <h3>{service.name}</h3><p>{service.summary}</p>
          <strong>{money(service.minCents)}–{money(service.maxCents)}</strong>
        </article>)}</div>
        <h2 className="section-label evidence-heading">Published evidence</h2><p className="evidence-explainer">Dated, canonical records an agent can inspect and cite—with their publisher, freshness, and trust status attached.</p><EvidenceCards />
      </section>
      <aside><RequestForm /></aside>
    </div>
  </>;
}

function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}>{titleCase(status)}</span>;
}

function TermsBar({ serviceCase }: { serviceCase: ServiceCase }) {
  const offer = serviceCase.receipt?.acceptedOffer ?? serviceCase.offers.at(-1);
  if (!offer) return <div className="terms-bar empty"><span>LIVE TERMS</span><p>Waiting for the owner to send an offer.</p><b>Case rev {serviceCase.revision}</b></div>;
  return <div className="terms-bar">
    <span>LIVE TERMS · {serviceCase.receipt ? "ACCEPTED SNAPSHOT" : `OFFER V${offer.version}`}</span>
    <dl><div><dt>Total</dt><dd>{money(offer.totalCents)}</dd></div><div><dt>Arrival</dt><dd>{offer.arrivalWindow}</dd></div><div><dt>Deposit</dt><dd>{money(offer.depositCents)}</dd></div><div><dt>Parts</dt><dd>{offer.exclusions.some((item) => item.toLowerCase().includes("part")) ? "Excluded" : "Included"}</dd></div></dl>
    <b>Rev {serviceCase.revision}</b>
  </div>;
}

function Timeline({ serviceCase }: { serviceCase: ServiceCase }) {
  return <section className="case-panel timeline-panel"><div className="panel-heading"><h2>Case conversation</h2><span>{serviceCase.messages.length} events</span></div>
    <ol className="timeline">{serviceCase.messages.map((message) => <li className={`actor-${message.actor}`} key={message.id}>
      <div className="timeline-dot" aria-hidden="true" /><div><p><b>{titleCase(message.actor)}</b><span>{shortTime(message.createdAt)} · rev {message.revision}</span></p><blockquote>{message.text}</blockquote></div>
    </li>)}</ol>
  </section>;
}

function OfferCard({ offer, latest }: { offer: ServiceOffer; latest: boolean }) {
  return <article className={`offer-card ${latest ? "latest" : ""}`}>
    <header><div><span>OFFER VERSION</span><strong>V{offer.version}</strong></div>{latest && <em>LATEST SENT</em>}<b>{money(offer.totalCents)}</b></header>
    <dl><div><dt>Arrival</dt><dd>{offer.arrivalWindow}</dd></div><div><dt>Deposit</dt><dd>{money(offer.depositCents)}</dd></div><div><dt>Warranty</dt><dd>{offer.warrantyDays} days</dd></div><div><dt>Expires</dt><dd>{shortTime(offer.expiresAt)}</dd></div></dl>
    <div className="scope-grid"><div><span>Included</span>{offer.includedScope.map((item) => <p key={item}>+ {item}</p>)}</div><div><span>Excluded</span>{offer.exclusions.map((item) => <p key={item}>− {item}</p>)}</div></div>
    <a className="offer-context-link" href="/demo/operations#market">Inspect sourced price context + delivery plan →</a>
  </article>;
}

function OfferDiff({ serviceCase }: { serviceCase: ServiceCase }) {
  if (serviceCase.offers.length < 2) return null;
  const from = serviceCase.offers.at(-2)!;
  const to = serviceCase.offers.at(-1)!;
  const diff = compareOfferVersions(serviceCase, from.version, to.version)!;
  return <section className="diff-card"><header><div><span>OFFER DIFF</span><h3>V{from.version} → V{to.version}</h3></div><strong className={diff.priceDeltaCents <= 0 ? "positive" : "negative"}>{diff.priceDeltaCents <= 0 ? "−" : "+"}{money(Math.abs(diff.priceDeltaCents))}</strong></header>
    <div className="diff-row"><span>Arrival</span><b>{typeof diff.arrivalWindow === "string" ? "Unchanged" : `${diff.arrivalWindow.from} → ${diff.arrivalWindow.to}`}</b></div>
    <div className="diff-row"><span>Deposit</span><b>{diff.depositDeltaCents === 0 ? "Unchanged" : money(diff.depositDeltaCents)}</b></div>
    <div className="diff-row"><span>Exclusions</span><b>{diff.exclusionsAdded.length || diff.exclusionsRemoved.length ? "Changed" : "Unchanged"}</b></div>
  </section>;
}

function CounterForm({ serviceCase }: { serviceCase: ServiceCase }) {
  if (!["offer_available", "awaiting_provider", "negotiating"].includes(serviceCase.status)) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void promiseDiffStore.dispatchShared({
      type: "CUSTOMER_MESSAGE", caseId: serviceCase.id, expectedRevision: serviceCase.revision,
      kind: "counter", text: String(data.get("message")), proposedBudgetCents: Number(data.get("budget")) * 100,
      preferredWindow: "Today, 2–4 PM",
    }, "human_submit_counteroffer", "customer_human");
  };
  return <form className="counter-form" onSubmit={submit}><div><label htmlFor="counter-message">Question or counteroffer</label><textarea id="counter-message" name="message" rows={2} maxLength={1000} defaultValue="I can approve $175 maximum if there is no after-hours surcharge." required /></div><label>Max ($)<input name="budget" type="number" min={0} max={100000} defaultValue={175} required /></label><button className="button dark" type="submit">Send to owner</button></form>;
}

function CustomerDecision({ serviceCase }: { serviceCase: ServiceCase }) {
  const latest = serviceCase.offers.at(-1);
  if (serviceCase.status === "offer_available" && latest) return <div className="decision-gate"><div><span>AGENT MAY PREPARE</span><h3>Stage offer V{latest.version} for confirmation</h3><p>This displays the exact terms. It does not book or charge.</p></div><button className="button primary" onClick={() => void promiseDiffStore.dispatchShared({ type: "PREPARE_BOOKING", caseId: serviceCase.id, expectedRevision: serviceCase.revision, offerVersion: latest.version }, "human_prepare_booking", "customer_human")}>Prepare booking</button></div>;
  if (serviceCase.status === "booking_prepared" && latest) return <div className="decision-gate critical"><div><span>HUMAN DECISION</span><h3>Confirm {money(latest.totalCents)} · {latest.arrivalWindow}</h3><p>Simulated booking only. No payment or real appointment.</p></div><div className="button-row"><button className="button quiet" onClick={() => void promiseDiffStore.dispatchShared({ type: "CANCEL_BOOKING_PREPARATION", caseId: serviceCase.id }, "human_cancel_booking", "customer_human")}>Cancel</button><button className="button primary" onClick={() => void promiseDiffStore.dispatchShared({ type: "CONFIRM_BOOKING", caseId: serviceCase.id }, "human_confirm_booking", "customer_human")}>I confirm these terms</button></div></div>;
  return null;
}

function ChangeOrderPanel({ serviceCase }: { serviceCase: ServiceCase }) {
  const change = serviceCase.changeOrders.at(-1);
  if (!change) return null;
  const diff = compareChangeOrder(serviceCase, change.id);
  if (!diff) return null;
  return <section className="change-order"><header><div><span>UNEXPECTED CHANGE · {change.id}</span><h2>{change.reason}</h2></div><StatusPill status={change.status} /></header>
    <div className="change-math"><div><span>Accepted</span><b>{money(diff.originalTotalCents)}</b></div><i>+</i><div><span>Changed work</span><b>{money(diff.deltaCents)}</b></div><i>=</i><div className="new-total"><span>Proposed total</span><b>{money(diff.proposedTotalCents)}</b></div></div>
    <div className="change-details"><div><span>Added scope</span>{diff.addedScope.map((item) => <b key={item}>{item}</b>)}</div><div><span>Contract signal</span><b>{diff.explicitlyExcluded.length ? "Original offer excluded parts" : "Needs human scope review"}</b></div><div><span>Schedule impact</span><b>{diff.scheduleImpact}</b></div></div>
    {change.status === "pending" && <div className="human-choice"><p><strong>Only you can decide.</strong> Velaire compared the documents; it did not judge whether the charge is justified.</p><div className="button-row"><button className="button quiet" onClick={() => void promiseDiffStore.dispatchShared({ type: "DECIDE_CHANGE_ORDER", caseId: serviceCase.id, changeOrderId: change.id, decision: "rejected" }, "human_reject_change_order", "customer_human")}>Reject change</button><button className="button primary" onClick={() => void promiseDiffStore.dispatchShared({ type: "DECIDE_CHANGE_ORDER", caseId: serviceCase.id, changeOrderId: change.id, decision: "accepted" }, "human_accept_change_order", "customer_human")}>Accept +{money(change.deltaCents)}</button></div></div>}
  </section>;
}

function AuditRail({ audit, caseId }: { audit: AuditEvent[]; caseId: string }) {
  const items = audit.filter((item) => item.caseId === caseId).slice(-8).reverse();
  return <section className="audit-rail"><div className="panel-heading"><h2>Decision trail</h2><span>append-only</span></div>{items.length ? <ol>{items.map((item) => <li key={item.id}><i className={item.code === "OK" || item.code === "AWAITING_OWNER" || item.code === "AWAITING_HUMAN" ? "ok" : "warn"} /><div><b>{item.operation.replaceAll("_", " ")}</b><span>{item.actor.replaceAll("_", " ")} · {item.code}</span><small>rev {item.beforeRevision} → {item.afterRevision}</small></div></li>)}</ol> : <p>No recorded commands yet.</p>}</section>;
}

function stageDemoOffer(serviceCase: ServiceCase) {
  const revised = serviceCase.offers.length > 0;
  void promiseDiffStore.dispatchShared({
    type: "STAGE_OFFER", caseId: serviceCase.id, expectedRevision: serviceCase.revision,
    totalCents: revised ? 17500 : 19500, arrivalWindow: "Today, 2–4 PM",
    includedScope: ["Cooling diagnostic", "Diagnostic labour", "Written findings"],
    exclusions: revised ? ["Parts and refrigerant", "Work beyond written approval", "After-hours surcharge"] : ["Parts and refrigerant", "Work beyond written approval"],
    depositCents: 4900, warrantyDays: 30, expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  }, "human_stage_demo_offer", "owner_human");
}

function OwnerControls({ serviceCase, compact = false }: { serviceCase: ServiceCase; compact?: boolean }) {
  const draft = serviceCase.ownerDraft;
  const sendDraft = () => {
    if (!draft) return;
    const command = draft.kind === "reply" ? { type: "SEND_OWNER_REPLY" as const, caseId: serviceCase.id }
      : draft.kind === "offer" ? { type: "SEND_OFFER" as const, caseId: serviceCase.id }
        : { type: "SEND_CHANGE_ORDER" as const, caseId: serviceCase.id };
    void promiseDiffStore.dispatchShared(command, `human_send_${draft.kind}`, "owner_human");
  };
  return <div className={compact ? "owner-controls compact" : "owner-controls"}>
    <div className="owner-control-head"><div><span>OWNER AUTHORITY</span><h2>{compact ? "Judge simulator" : "Stage a response"}</h2></div><StatusPill status={serviceCase.status} /></div>
    {!draft && <div className="owner-presets">
      {serviceCase.status === "awaiting_provider" && <><button className="action-tile" onClick={() => void promiseDiffStore.dispatchShared({ type: "STAGE_OWNER_REPLY", caseId: serviceCase.id, expectedRevision: serviceCase.revision, text: "I can review this same-day request. I will send exact terms next." }, "human_stage_owner_reply", "owner_human")}><span>01</span><b>Stage acknowledgement</b><small>Private until human sends</small></button><button className="action-tile highlighted" onClick={() => stageDemoOffer(serviceCase)}><span>02</span><b>Stage $195 offer</b><small>2–4 PM · $49 deposit</small></button></>}
      {serviceCase.status === "negotiating" && <button className="action-tile highlighted" onClick={() => stageDemoOffer(serviceCase)}><span>03</span><b>Stage revised $175 offer</b><small>Preserves time; clarifies exclusions</small></button>}
      {serviceCase.status === "offer_available" && <p className="waiting-note">The sent offer is waiting for the customer. The owner cannot accept it on their behalf.</p>}
      {serviceCase.status === "booking_prepared" && <p className="waiting-note">The customer is reviewing exact terms. There is no owner-side confirmation control.</p>}
      {serviceCase.status === "booked" && <button className="action-tile warning" onClick={() => void promiseDiffStore.dispatchShared({ type: "STAGE_CHANGE_ORDER", caseId: serviceCase.id, expectedRevision: serviceCase.revision, reason: "Weak capacitor found during diagnostic", addedScope: ["Replacement part: capacitor", "Capacitor installation"], removedScope: [], deltaCents: 14500, scheduleImpact: "Adds approximately 30 minutes; same arrival window" }, "human_stage_change_order", "owner_human")}><span>04</span><b>Stage +$145 change order</b><small>Private until human sends</small></button>}
      {serviceCase.status === "change_pending" && <p className="waiting-note">The customer must accept or reject the changed work. The accepted snapshot is still locked.</p>}
    </div>}
    {draft && <div className="draft-sheet"><div className="draft-banner"><span>PRIVATE DRAFT</span><b>Not customer-visible</b></div><h3>{titleCase(draft.kind)}</h3>
      {draft.kind === "reply" && <p>{draft.text}</p>}
      {draft.kind === "offer" && <><strong className="draft-price">{money(draft.totalCents)}</strong><p>{draft.arrivalWindow} · {money(draft.depositCents)} deposit</p><ul>{draft.includedScope.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {draft.kind === "change_order" && <><strong className="draft-price">+{money(draft.deltaCents)}</strong><p>{draft.reason}</p><ul>{draft.addedScope.map((item) => <li key={item}>{item}</li>)}</ul></>}
      <button className="button primary full" onClick={sendDraft}>Human: send {draft.kind.replace("_", " ")}</button><small>Sending creates a new public case revision.</small>
    </div>}
  </div>;
}

function SharedCasePanel({ serviceCase }: { serviceCase: ServiceCase }) {
  const [copyLabel, setCopyLabel] = useState("Copy owner invite");
  const session = promiseDiffStore.getSharedSession();
  const ownerInvite = promiseDiffStore.getOwnerInviteUrl();
  const visuals = caseVisuals(serviceCase, window.location.origin, session?.role === "customer" ? session.accessToken : undefined);
  const copyInvite = async () => {
    if (!ownerInvite) return;
    try {
      await navigator.clipboard.writeText(ownerInvite);
      setCopyLabel("Owner invite copied");
    } catch {
      setCopyLabel("Select the link manually");
    }
  };
  return <section className="shared-case-panel" aria-label="Shared case access">
    <div><span className="live-orb" aria-hidden="true" /><p><b>{session ? "Shared case is live" : "Browser-local preview"}</b><small>{session ? "Customer and owner pages refresh from one durable case." : "Open a new case on the live site to create separate capability links."}</small></p></div>
    <div className="shared-case-actions">
      {ownerInvite && <button className="button copper" type="button" onClick={copyInvite}>{copyLabel}</button>}
      <a className="button quiet" href={visuals.visualUrl}>Open case graph ↗</a>
      <a className="button quiet" href={visuals.route?.directions.googleMapsUrl ?? visuals.location.googleMapsUrl} target="_blank" rel="noreferrer">{visuals.route ? "Open driving route ↗" : "Open map ↗"}</a>
    </div>
    {ownerInvite && <small className="capability-warning">Private capability link: send it only to the owner chat. Production would deliver this server-side.</small>}
  </section>;
}

function CustomerCase({ serviceCase, judge }: { serviceCase: ServiceCase; judge: boolean }) {
  const state = usePromiseDiffState();
  const latest = serviceCase.offers.at(-1);
  const session = promiseDiffStore.getSharedSession();
  const receiptHref = serviceCase.receipt ? new URL(`/receipt/${encodeURIComponent(serviceCase.receipt.id)}`, window.location.origin) : undefined;
  if (receiptHref) {
    receiptHref.searchParams.set("case", serviceCase.id);
    if (session?.role === "customer" && session.caseId === serviceCase.id) receiptHref.searchParams.set("access", session.accessToken);
  }
  return <>
    <div className="case-title"><div><p className="eyebrow">Velaire Heating &amp; Air / service case</p><h1>{serviceCase.problemSummary}</h1><p><code>{serviceCase.id}</code> · Postcode {serviceCase.postcode} · {titleCase(serviceCase.urgency)}</p></div><StatusPill status={serviceCase.status} /></div>
    <SharedCasePanel serviceCase={serviceCase} />
    <TermsBar serviceCase={serviceCase} />
    <div className={`case-layout ${judge ? "with-judge" : ""}`}>
      <div className="case-main">
        <Timeline serviceCase={serviceCase} />
        {serviceCase.offers.length > 0 && <section className="case-panel"><div className="panel-heading"><h2>Sent offers</h2><span>Drafts never appear here</span></div><div className="offers-grid">{serviceCase.offers.map((offer) => <OfferCard key={offer.version} offer={offer} latest={offer.version === latest?.version} />)}</div><OfferDiff serviceCase={serviceCase} /></section>}
        <CounterForm serviceCase={serviceCase} />
        <CustomerDecision serviceCase={serviceCase} />
        {serviceCase.receipt && <div className="receipt-callout"><div><span>IMMUTABLE RECEIPT</span><h3>{serviceCase.receipt.id}</h3><p>Accepted offer V{serviceCase.receipt.acceptedOffer.version} is frozen independently of future displays.</p></div><a className="button quiet" href={receiptHref?.toString()}>Open receipt ↗</a></div>}
        <ChangeOrderPanel serviceCase={serviceCase} />
      </div>
      <aside className="case-side">{judge && <OwnerControls serviceCase={serviceCase} compact />}<AuditRail audit={state.audit} caseId={serviceCase.id} /><div className="side-evidence"><div className="panel-heading"><h2>Source cards</h2><span>canonical</span></div><p className="evidence-explainer compact">Dated claims with provenance and an explicit trust label.</p><EvidenceCards compact /></div></aside>
    </div>
  </>;
}

function CustomerPage({ status }: { status: WebMCPStatus | null }) {
  const state = usePromiseDiffState();
  const params = new URLSearchParams(window.location.search);
  const selected = params.get("case");
  const serviceCase = state.cases.find((item) => item.id === selected) ?? (selected ? undefined : state.cases[0]);
  const shared = promiseDiffStore.getSharedSession()?.role === "customer";
  return <main className="app-page customer-page">
    <div className="demo-ribbon"><SyntheticFlag /><span>All businesses, people, reviews, prices, bookings, and records on this page are fictional.</span><button onClick={() => { if (window.confirm(shared ? "Leave this shared fictional case on this device? The durable demo record will remain available through its private links." : "Reset every fictional Velaire service case in this browser?")) { promiseDiffStore.reset(); window.history.replaceState({}, "", "/demo/customer"); } }}>Reset demo</button></div>
    <AgentGuide status={status} serviceCase={serviceCase} compact />
    {serviceCase ? <CustomerCase serviceCase={serviceCase} judge={!shared && params.get("judge") === "1"} /> : <Storefront />}
  </main>;
}

function OwnerPage({ status }: { status: WebMCPStatus | null }) {
  const state = usePromiseDiffState();
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("case");
  const selected = state.cases.find((item) => item.id === requested) ?? state.cases[0];
  return <main className="app-page owner-page">
    <div className="demo-ribbon owner"><SyntheticFlag /><span>Private owner capability · use this URL only in the owner chat.</span></div>
    <AgentGuide status={status} serviceCase={selected} compact role="owner" />
    <div className="owner-title"><div><p className="eyebrow">Velaire operations desk</p><h1>Shared service case</h1><p>The owner agent may stage. A human owner sends every customer-visible commitment.</p></div><div className="queue-count"><strong>{state.cases.length}</strong><span>accessible demo case</span></div></div>
    {selected ? <div className="owner-layout">
      <aside className="case-queue"><h2>Cases</h2>{state.cases.map((item) => <a className={item.id === selected.id ? "selected" : ""} href={`/demo/owner?case=${item.id}`} key={item.id}><span><b>{item.id}</b><small>{item.problemSummary}</small></span><StatusPill status={item.status} /></a>)}</aside>
      <section className="owner-work"><div className="owner-case-meta"><div><span>SELECTED CASE</span><h2>{selected.problemSummary}</h2></div><a href={caseVisuals(selected, window.location.origin).route?.directions.googleMapsUrl ?? caseVisuals(selected, window.location.origin).location.googleMapsUrl} target="_blank" rel="noreferrer">Open driving route ↗</a></div><TermsBar serviceCase={selected} /><OwnerControls serviceCase={selected} /><Timeline serviceCase={selected} /><AuditRail audit={state.audit} caseId={selected.id} /></section>
    </div> : <div className="empty-state"><span>NO CAPABILITY</span><h2>Open the private owner invite from the customer case.</h2><p>A case cannot be discovered by ID alone; the owner URL carries a separate capability token.</p><a className="button primary" href="/demo/customer">Open customer room</a></div>}
  </main>;
}

function EvidencePage({ sourceId }: { sourceId: string }) {
  const source = EVIDENCE.find((item) => item.id === sourceId);
  if (!source) return <NotFound />;
  return <main className="document-page"><a className="back-link" href="/demo/customer">← Customer room</a><article className="source-document"><header><span className="source-document-icon"><EvidenceIcon topic={source.topic} /></span><div><p className="eyebrow">Canonical source card</p><h1>{titleCase(source.topic)}</h1></div><SyntheticFlag /></header><blockquote>{source.claim}</blockquote><dl><div><dt>Publisher</dt><dd>{source.publisher}</dd></div><div><dt>Evidence type</dt><dd>{source.evidenceType.replaceAll("_", " ")}</dd></div><div><dt>Refreshed</dt><dd>{new Date(source.refreshedAt).toLocaleDateString()}</dd></div><div><dt>Verification</dt><dd>Not independently verified</dd></div></dl><div className="document-warning"><strong>Trust boundary</strong><p>This source exists solely for the fictional Velaire demonstration. Agents receive its provenance and untrusted-content status with the claim.</p></div></article></main>;
}

function ReceiptPage({ receiptId }: { receiptId: string }) {
  const state = usePromiseDiffState();
  const serviceCase = state.cases.find((item) => item.receipt?.id === receiptId);
  const receipt = serviceCase?.receipt;
  if (!serviceCase || !receipt) return <main className="document-page"><a className="back-link" href="/demo/customer">← Customer room</a><div className="empty-state"><span>RECEIPT NOT FOUND</span><h2>This simulated receipt only exists in the browser where it was confirmed.</h2></div></main>;
  const offer = receipt.acceptedOffer;
  const backUrl = new URL("/demo/customer", window.location.origin);
  backUrl.searchParams.set("case", serviceCase.id);
  const session = promiseDiffStore.getSharedSession();
  if (session?.role === "customer") backUrl.searchParams.set("access", session.accessToken);
  return <main className="document-page"><a className="back-link" href={backUrl.toString()}>← Return to case</a><article className="receipt-document"><header><div><p className="eyebrow">Accepted promise snapshot</p><h1>{receipt.id}</h1><p>Confirmed {new Date(receipt.confirmedAt).toLocaleString()}</p></div><SyntheticFlag /></header><div className="receipt-total"><span>Accepted total</span><strong>{money(offer.totalCents)}</strong></div><dl><div><dt>Case</dt><dd>{receipt.caseId}</dd></div><div><dt>Offer version</dt><dd>V{offer.version}</dd></div><div><dt>Arrival</dt><dd>{offer.arrivalWindow}</dd></div><div><dt>Deposit</dt><dd>{money(offer.depositCents)}</dd></div><div><dt>Warranty</dt><dd>{offer.warrantyDays} days</dd></div><div><dt>Simulation</dt><dd>No payment or real appointment</dd></div></dl><div className="scope-grid"><div><span>Accepted scope</span>{offer.includedScope.map((item) => <p key={item}>+ {item}</p>)}</div><div><span>Accepted exclusions</span>{offer.exclusions.map((item) => <p key={item}>− {item}</p>)}</div></div>{receipt.decisions.length > 0 && <div className="receipt-decisions"><h2>Later decisions</h2>{receipt.decisions.map((decision) => <p key={decision.changeOrderId}><b>{decision.changeOrderId}</b><StatusPill status={decision.decision} /><span>{new Date(decision.decidedAt).toLocaleString()}</span></p>)}</div>}</article><MarketPanel compact /></main>;
}

function CaseGraphPage({ caseId }: { caseId: string }) {
  const state = usePromiseDiffState();
  const serviceCase = state.cases.find((item) => item.id === caseId);
  if (!serviceCase) return <main className="document-page"><div className="empty-state"><span>LOADING SHARED CASE</span><h2>Checking the private customer capability…</h2><p>If this remains empty, reopen the complete customer graph link.</p></div></main>;
  const session = promiseDiffStore.getSharedSession();
  const visuals = caseVisuals(serviceCase, window.location.origin, session?.role === "customer" ? session.accessToken : undefined);
  const customerUrl = new URL("/demo/customer", window.location.origin);
  customerUrl.searchParams.set("case", serviceCase.id);
  if (session?.role === "customer") customerUrl.searchParams.set("access", session.accessToken);
  const width = Math.max(760, visuals.nodes.length * 190);
  return <main className="document-page graph-page">
    <a className="back-link" href={customerUrl.toString()}>← Return to customer case</a>
    <article className="graph-document">
      <header><div><p className="eyebrow">Shared case graph · revision {serviceCase.revision}</p><h1>{serviceCase.id}</h1><p>{visuals.stageLabel}</p></div><StatusPill status={serviceCase.status} /></header>
      <div className="graph-scroll" role="img" aria-label={`Event graph for ${serviceCase.id}`}>
        <svg viewBox={`0 0 ${width} 250`} width={width} height="250">
          <title>{`Velaire service case ${serviceCase.id} event sequence`}</title>
          {visuals.nodes.slice(1).map((node, index) => <line key={`line-${node.id}`} x1={105 + index * 190} y1="92" x2={245 + index * 190} y2="92" className="graph-edge" />)}
          {visuals.nodes.map((node, index) => <g key={node.id} transform={`translate(${30 + index * 190} 35)`}>
            <rect width="150" height="118" rx="18" className={`graph-node actor-${node.actor}`} />
            <text x="16" y="28" className="graph-actor">{titleCase(node.actor)}</text>
            <text x="16" y="52" className="graph-revision">Revision {node.revision}</text>
            <text x="16" y="77" className="graph-copy">{node.label.slice(0, 20)}</text>
            <text x="16" y="97" className="graph-copy">{node.label.slice(20, 40)}{node.label.length > 40 ? "…" : ""}</text>
          </g>)}
        </svg>
      </div>
      <div className="graph-summary-grid"><section><span>CURRENT STAGE</span><strong>{visuals.stageLabel}</strong><small>Case rev {visuals.revision}</small></section><section><span>SERVICE LOCATION</span><strong>{visuals.location.text}</strong><small>{visuals.location.customerConfirmed ? "Customer confirmed" : "Postcode-derived search"}</small></section><section><span>LATEST OFFER</span><strong>{visuals.totals.latestOfferCents === null ? "Not sent" : money(visuals.totals.latestOfferCents)}</strong><small>Accepted: {visuals.totals.acceptedCents === null ? "—" : money(visuals.totals.acceptedCents)}</small></section></div>
      {visuals.route && <section className="route-card"><header><div><span>DRIVING PLAN · SYNTHETIC RANGE</span><h2>{visuals.route.planningEstimate.lowerMinutes}–{visuals.route.planningEstimate.upperMinutes} min</h2><p>If dispatch left now: {visuals.route.planningEstimate.display}</p></div><div className="route-authority"><span>SERVICE WINDOW</span><b>{visuals.route.requestedOrOfferedWindow ?? "Not set"}</b><small>{visuals.route.windowAuthority.replaceAll("_", " ")}</small></div></header><div className="route-track"><div><i aria-hidden="true" /><span>FROM</span><b>{visuals.route.origin.text}</b><small>{visuals.route.origin.label}</small></div><span className="route-line" aria-hidden="true">DRIVING</span><div><i aria-hidden="true" /><span>TO</span><b>{visuals.route.destination.text}</b><small>Customer-confirmed {visuals.route.destination.precision}</small></div></div><div className="button-row graph-links"><a className="button primary" href={visuals.route.directions.googleMapsUrl} target="_blank" rel="noreferrer">Google driving route ↗</a><a className="button quiet" href={visuals.route.directions.appleMapsUrl} target="_blank" rel="noreferrer">Apple Maps ↗</a><a className="button quiet" href={visuals.location.openStreetMapUrl} target="_blank" rel="noreferrer">OpenStreetMap search ↗</a></div><p className="graph-limitation">{visuals.route.limitation}</p></section>}
      {!visuals.route && <><div className="button-row graph-links"><a className="button primary" href={visuals.location.googleMapsUrl} target="_blank" rel="noreferrer">Google Maps search ↗</a><a className="button quiet" href={visuals.location.openStreetMapUrl} target="_blank" rel="noreferrer">OpenStreetMap ↗</a></div><p className="graph-limitation">Confirm a service location to create driving links and a planning arrival range.</p></>}
    </article>
  </main>;
}

function NotFound() {
  return <main className="document-page"><div className="empty-state"><span>404 / NO ROUTE</span><h1>This agreement room does not exist.</h1><a className="button primary" href="/">Return home</a></div></main>;
}

export function App() {
  useSharedCaseSync();
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const route = routeKind(pathname);
  const webMCP = useWebMCP(route);
  let page: ReactNode;
  if (pathname === "/") page = <Landing status={webMCP} />;
  else if (pathname === "/demo/customer") page = <CustomerPage status={webMCP} />;
  else if (pathname === "/demo/owner") page = <OwnerPage status={webMCP} />;
  else if (pathname === "/demo/operations") page = <OperationsPage status={webMCP} />;
  else if (pathname.startsWith("/case-graph/")) page = <CaseGraphPage caseId={decodeURIComponent(pathname.slice("/case-graph/".length))} />;
  else if (pathname.startsWith("/evidence/")) page = <EvidencePage sourceId={decodeURIComponent(pathname.slice("/evidence/".length))} />;
  else if (pathname.startsWith("/receipt/")) page = <ReceiptPage receiptId={decodeURIComponent(pathname.slice("/receipt/".length))} />;
  else page = <NotFound />;
  return <Shell status={webMCP}>{page}</Shell>;
}

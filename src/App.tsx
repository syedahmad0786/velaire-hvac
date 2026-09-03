import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import {
  EVIDENCE,
  SERVICES,
  compareChangeOrder,
  compareOfferVersions,
  type AuditEvent,
  type ServiceCase,
  type ServiceOffer,
} from "./domain";
import { promiseDiffStore } from "./store";
import { installWebMCP, type ToolRoute, type WebMCPStatus } from "./webmcp";

function usePromiseDiffState() {
  return useSyncExternalStore(promiseDiffStore.subscribe, promiseDiffStore.getSnapshot, promiseDiffStore.getSnapshot);
}

function routeKind(pathname: string): ToolRoute {
  if (pathname === "/demo/customer") return "customer";
  if (pathname === "/demo/owner") return "owner";
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

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const shortTime = (value: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function Logo() {
  return <a className="logo" href="/" aria-label="PromiseDiff home"><span className="logo-mark" aria-hidden="true">P≠</span><span>PromiseDiff</span></a>;
}

function Shell({ children, status }: { children: ReactNode; status: WebMCPStatus | null }) {
  return <>
    <header className="topbar">
      <Logo />
      <nav aria-label="Primary navigation">
        <a href="/demo/customer?judge=1">Customer room</a>
        <a href="/demo/owner">Owner desk</a>
        <a href="https://github.com/syedahmad0786/promisediff-webmcp" target="_blank" rel="noreferrer">Source</a>
      </nav>
      <div className={`mcp-indicator ${status?.supported ? "is-live" : ""}`} title={status?.errors.join("\n") || undefined}>
        <span aria-hidden="true" />
        {status?.supported ? `${status.registered.length} WebMCP tools live` : "Human mode ready"}
      </div>
    </header>
    {children}
    <footer><Logo /><p>One shared record. No invisible commitments.</p><span>Synthetic hackathon demonstration · 2026</span></footer>
  </>;
}

function SyntheticFlag() {
  return <span className="synthetic-flag">Synthetic demo</span>;
}

function Landing() {
  return <main>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">A WebMCP-native agreement room</p>
        <h1>Make the promise visible before the work begins.</h1>
        <p className="lede">PromiseDiff lets a customer agent and a local service business discover, negotiate, book, and compare changed work—without letting either agent make the human decision.</p>
        <div className="button-row">
          <a className="button primary" href="/demo/customer?judge=1">Run the guided case <span aria-hidden="true">→</span></a>
          <a className="button quiet" href="/demo/owner">Open owner desk</a>
        </div>
        <p className="microcopy"><SyntheticFlag /> No login, payment, calendar, or external credentials required.</p>
      </div>
      <div className="promise-sheet" aria-label="Example accepted terms and proposed change">
        <div className="sheet-header"><span>CASE / SC-DEMO</span><span>REVISION 07</span></div>
        <p className="sheet-kicker">Accepted promise</p>
        <div className="sheet-price"><strong>$175</strong><span>2–4 PM · $49 deposit</span></div>
        <ul className="term-list">
          <li><span>Diagnostic + labour</span><b className="kept">kept</b></li>
          <li><span>No surprise travel fee</span><b className="kept">kept</b></li>
          <li><span>Parts</span><b className="excluded">excluded</b></li>
        </ul>
        <div className="change-slip">
          <span>CHANGE ORDER CO-01</span>
          <strong>+$145</strong>
          <p>Capacitor replacement · approval required</p>
        </div>
      </div>
    </section>

    <section className="proof-band" aria-label="Product principles">
      <article><strong>10</strong><span>customer tools</span></article>
      <article><strong>5</strong><span>owner tools</span></article>
      <article><strong>0</strong><span>agent approval tools</span></article>
      <article><strong>1</strong><span>authoritative case</span></article>
    </section>

    <section className="section split-intro">
      <div><p className="eyebrow">Why this exists</p><h2>Service agreements break in the gap between a chat and an invoice.</h2></div>
      <p>Search tools can find a provider. Booking tools can reserve a slot. PromiseDiff handles the unresolved middle: what was asked, what was offered, what changed, and which exact version a human approved.</p>
    </section>

    <section className="process-grid section" aria-label="PromiseDiff journey">
      {[
        ["01", "Discover", "Match the need to service area, price bands, policies, and evidence."],
        ["02", "Negotiate", "Pass questions and structured counteroffers through one versioned case."],
        ["03", "Confirm", "Let the agent prepare exact terms; keep the final booking click human."],
        ["04", "Diff", "Compare later scope and price against the immutable accepted snapshot."],
      ].map(([number, label, copy]) => <article key={number}><span>{number}</span><h3>{label}</h3><p>{copy}</p></article>)}
    </section>

    <section className="section boundary-callout">
      <div><p className="eyebrow">The product is the boundary</p><h2>Agents can prepare. Humans commit.</h2></div>
      <div className="boundary-flow" aria-label="Authority flow">
        <span>Agent reads</span><i>→</i><span>Agent stages</span><i>→</i><strong>Human approves</strong><i>→</i><span>Receipt locks</span>
      </div>
    </section>
  </main>;
}

function EvidenceCards({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "evidence-list compact" : "evidence-list"}>
    {EVIDENCE.map((card) => <a href={card.canonicalPath} className="evidence-card" key={card.id}>
      <span className="evidence-icon" aria-hidden="true">{card.topic.slice(0, 2).toUpperCase()}</span>
      <span><b>{titleCase(card.topic)}</b><small>{card.evidenceType.replaceAll("_", " ")} · not independently verified</small></span>
      <span aria-hidden="true">↗</span>
    </a>)}
  </div>;
}

function RequestForm() {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = promiseDiffStore.dispatch({
      type: "OPEN_CASE",
      serviceId: String(data.get("serviceId")),
      problemSummary: String(data.get("problemSummary")),
      postcode: String(data.get("postcode")),
      urgency: "same_day",
      budgetCents: Number(data.get("budgetDollars")) * 100,
      preferredWindows: ["Today, 2–4 PM"],
      constraints: ["No surprise travel fee", "Approval required before additional work"],
    }, "human_open_service_case", "customer_human");
    if (result.caseId) {
      const url = new URL(window.location.href);
      url.searchParams.set("case", result.caseId);
      url.searchParams.set("judge", "1");
      window.history.replaceState({}, "", url);
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
    <div className="constraint-note"><b>Shared with owner</b><span>Today 2–4 PM · No surprise travel fee · Approval before changed work</span></div>
    <button className="button primary full" type="submit">Open service case <span aria-hidden="true">→</span></button>
    <small>Do not enter an exact address, contact details, or payment information.</small>
  </form>;
}

function Storefront() {
  return <>
    <div className="storefront-heading">
      <div><p className="eyebrow">DemoAir HVAC · Chicago</p><h1>Clear terms. Comfortable homes.</h1><p>Published ranges, versioned offers, and approval before additional work.</p></div>
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
        <h2 className="section-label evidence-heading">Published evidence</h2><EvidenceCards />
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
    promiseDiffStore.dispatch({
      type: "CUSTOMER_MESSAGE", caseId: serviceCase.id, expectedRevision: serviceCase.revision,
      kind: "counter", text: String(data.get("message")), proposedBudgetCents: Number(data.get("budget")) * 100,
      preferredWindow: "Today, 2–4 PM",
    }, "human_submit_counteroffer", "customer_human");
  };
  return <form className="counter-form" onSubmit={submit}><div><label htmlFor="counter-message">Question or counteroffer</label><textarea id="counter-message" name="message" rows={2} maxLength={1000} defaultValue="I can approve $175 maximum if there is no after-hours surcharge." required /></div><label>Max ($)<input name="budget" type="number" min={0} defaultValue={175} required /></label><button className="button dark" type="submit">Send to owner</button></form>;
}

function CustomerDecision({ serviceCase }: { serviceCase: ServiceCase }) {
  const latest = serviceCase.offers.at(-1);
  if (serviceCase.status === "offer_available" && latest) return <div className="decision-gate"><div><span>AGENT MAY PREPARE</span><h3>Stage offer V{latest.version} for confirmation</h3><p>This displays the exact terms. It does not book or charge.</p></div><button className="button primary" onClick={() => promiseDiffStore.dispatch({ type: "PREPARE_BOOKING", caseId: serviceCase.id, expectedRevision: serviceCase.revision, offerVersion: latest.version }, "human_prepare_booking", "customer_human")}>Prepare booking</button></div>;
  if (serviceCase.status === "booking_prepared" && latest) return <div className="decision-gate critical"><div><span>HUMAN DECISION</span><h3>Confirm {money(latest.totalCents)} · {latest.arrivalWindow}</h3><p>Simulated booking only. No payment or real appointment.</p></div><div className="button-row"><button className="button quiet" onClick={() => promiseDiffStore.dispatch({ type: "CANCEL_BOOKING_PREPARATION", caseId: serviceCase.id }, "human_cancel_booking", "customer_human")}>Cancel</button><button className="button primary" onClick={() => promiseDiffStore.dispatch({ type: "CONFIRM_BOOKING", caseId: serviceCase.id }, "human_confirm_booking", "customer_human")}>I confirm these terms</button></div></div>;
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
    {change.status === "pending" && <div className="human-choice"><p><strong>Only you can decide.</strong> PromiseDiff compared the documents; it did not judge whether the charge is justified.</p><div className="button-row"><button className="button quiet" onClick={() => promiseDiffStore.dispatch({ type: "DECIDE_CHANGE_ORDER", caseId: serviceCase.id, changeOrderId: change.id, decision: "rejected" }, "human_reject_change_order", "customer_human")}>Reject change</button><button className="button primary" onClick={() => promiseDiffStore.dispatch({ type: "DECIDE_CHANGE_ORDER", caseId: serviceCase.id, changeOrderId: change.id, decision: "accepted" }, "human_accept_change_order", "customer_human")}>Accept +{money(change.deltaCents)}</button></div></div>}
  </section>;
}

function AuditRail({ audit, caseId }: { audit: AuditEvent[]; caseId: string }) {
  const items = audit.filter((item) => item.caseId === caseId).slice(-8).reverse();
  return <section className="audit-rail"><div className="panel-heading"><h2>Decision trail</h2><span>append-only</span></div>{items.length ? <ol>{items.map((item) => <li key={item.id}><i className={item.code === "OK" || item.code === "AWAITING_OWNER" || item.code === "AWAITING_HUMAN" ? "ok" : "warn"} /><div><b>{item.operation.replaceAll("_", " ")}</b><span>{item.actor.replaceAll("_", " ")} · {item.code}</span><small>rev {item.beforeRevision} → {item.afterRevision}</small></div></li>)}</ol> : <p>No recorded commands yet.</p>}</section>;
}

function stageDemoOffer(serviceCase: ServiceCase) {
  const revised = serviceCase.offers.length > 0;
  promiseDiffStore.dispatch({
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
    promiseDiffStore.dispatch(command, `human_send_${draft.kind}`, "owner_human");
  };
  return <div className={compact ? "owner-controls compact" : "owner-controls"}>
    <div className="owner-control-head"><div><span>OWNER AUTHORITY</span><h2>{compact ? "Judge simulator" : "Stage a response"}</h2></div><StatusPill status={serviceCase.status} /></div>
    {!draft && <div className="owner-presets">
      {serviceCase.status === "awaiting_provider" && <><button className="action-tile" onClick={() => promiseDiffStore.dispatch({ type: "STAGE_OWNER_REPLY", caseId: serviceCase.id, expectedRevision: serviceCase.revision, text: "I can review this same-day request. I will send exact terms next." }, "human_stage_owner_reply", "owner_human")}><span>01</span><b>Stage acknowledgement</b><small>Private until human sends</small></button><button className="action-tile highlighted" onClick={() => stageDemoOffer(serviceCase)}><span>02</span><b>Stage $195 offer</b><small>2–4 PM · $49 deposit</small></button></>}
      {serviceCase.status === "negotiating" && <button className="action-tile highlighted" onClick={() => stageDemoOffer(serviceCase)}><span>03</span><b>Stage revised $175 offer</b><small>Preserves time; clarifies exclusions</small></button>}
      {serviceCase.status === "offer_available" && <p className="waiting-note">The sent offer is waiting for the customer. The owner cannot accept it on their behalf.</p>}
      {serviceCase.status === "booking_prepared" && <p className="waiting-note">The customer is reviewing exact terms. There is no owner-side confirmation control.</p>}
      {serviceCase.status === "booked" && <button className="action-tile warning" onClick={() => promiseDiffStore.dispatch({ type: "STAGE_CHANGE_ORDER", caseId: serviceCase.id, expectedRevision: serviceCase.revision, reason: "Weak capacitor found during diagnostic", addedScope: ["Replacement part: capacitor", "Capacitor installation"], removedScope: [], deltaCents: 14500, scheduleImpact: "Adds approximately 30 minutes; same arrival window" }, "human_stage_change_order", "owner_human")}><span>04</span><b>Stage +$145 change order</b><small>Private until human sends</small></button>}
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

function CustomerCase({ serviceCase, judge }: { serviceCase: ServiceCase; judge: boolean }) {
  const state = usePromiseDiffState();
  const latest = serviceCase.offers.at(-1);
  return <>
    <div className="case-title"><div><p className="eyebrow">DemoAir HVAC / service case</p><h1>{serviceCase.problemSummary}</h1><p><code>{serviceCase.id}</code> · Postcode {serviceCase.postcode} · {titleCase(serviceCase.urgency)}</p></div><StatusPill status={serviceCase.status} /></div>
    <TermsBar serviceCase={serviceCase} />
    <div className={`case-layout ${judge ? "with-judge" : ""}`}>
      <div className="case-main">
        <Timeline serviceCase={serviceCase} />
        {serviceCase.offers.length > 0 && <section className="case-panel"><div className="panel-heading"><h2>Sent offers</h2><span>Drafts never appear here</span></div><div className="offers-grid">{serviceCase.offers.map((offer) => <OfferCard key={offer.version} offer={offer} latest={offer.version === latest?.version} />)}</div><OfferDiff serviceCase={serviceCase} /></section>}
        <CounterForm serviceCase={serviceCase} />
        <CustomerDecision serviceCase={serviceCase} />
        {serviceCase.receipt && <div className="receipt-callout"><div><span>IMMUTABLE RECEIPT</span><h3>{serviceCase.receipt.id}</h3><p>Accepted offer V{serviceCase.receipt.acceptedOffer.version} is frozen independently of future displays.</p></div><a className="button quiet" href={`/receipt/${serviceCase.receipt.id}`}>Open receipt ↗</a></div>}
        <ChangeOrderPanel serviceCase={serviceCase} />
      </div>
      <aside className="case-side">{judge && <OwnerControls serviceCase={serviceCase} compact />}<AuditRail audit={state.audit} caseId={serviceCase.id} /><div className="side-evidence"><div className="panel-heading"><h2>Source cards</h2><span>canonical</span></div><EvidenceCards compact /></div></aside>
    </div>
  </>;
}

function CustomerPage() {
  const state = usePromiseDiffState();
  const params = new URLSearchParams(window.location.search);
  const selected = params.get("case");
  const serviceCase = state.cases.find((item) => item.id === selected) ?? (selected ? undefined : state.cases[0]);
  return <main className="app-page customer-page">
    <div className="demo-ribbon"><SyntheticFlag /><span>All businesses, people, reviews, prices, bookings, and records on this page are fictional.</span><button onClick={() => { if (window.confirm("Reset every synthetic PromiseDiff case in this browser?")) { promiseDiffStore.reset(); window.history.replaceState({}, "", "/demo/customer?judge=1"); } }}>Reset demo</button></div>
    {serviceCase ? <CustomerCase serviceCase={serviceCase} judge={params.get("judge") === "1"} /> : <Storefront />}
  </main>;
}

function OwnerPage() {
  const state = usePromiseDiffState();
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("case");
  const selected = state.cases.find((item) => item.id === requested) ?? state.cases[0];
  return <main className="app-page owner-page">
    <div className="demo-ribbon owner"><SyntheticFlag /><span>Provider route · demo capability boundary, not production authentication.</span></div>
    <div className="owner-title"><div><p className="eyebrow">DemoAir operations desk</p><h1>Service case queue</h1><p>Agents may stage. A human owner sends every customer-visible commitment.</p></div><div className="queue-count"><strong>{state.cases.length}</strong><span>open demo cases</span></div></div>
    {selected ? <div className="owner-layout">
      <aside className="case-queue"><h2>Cases</h2>{state.cases.map((item) => <a className={item.id === selected.id ? "selected" : ""} href={`/demo/owner?case=${item.id}`} key={item.id}><span><b>{item.id}</b><small>{item.problemSummary}</small></span><StatusPill status={item.status} /></a>)}</aside>
      <section className="owner-work"><div className="owner-case-meta"><div><span>SELECTED CASE</span><h2>{selected.problemSummary}</h2></div><a href={`/demo/customer?case=${selected.id}&judge=1`}>Open customer view ↗</a></div><TermsBar serviceCase={selected} /><OwnerControls serviceCase={selected} /><Timeline serviceCase={selected} /><AuditRail audit={state.audit} caseId={selected.id} /></section>
    </div> : <div className="empty-state"><span>QUEUE EMPTY</span><h2>Open the synthetic customer request first.</h2><p>The owner desk will receive the versioned service case instantly through local browser synchronization.</p><a className="button primary" href="/demo/customer?judge=1">Open customer room</a></div>}
  </main>;
}

function EvidencePage({ sourceId }: { sourceId: string }) {
  const source = EVIDENCE.find((item) => item.id === sourceId);
  if (!source) return <NotFound />;
  return <main className="document-page"><a className="back-link" href="/demo/customer">← Customer room</a><article className="source-document"><header><div><p className="eyebrow">Canonical source card</p><h1>{titleCase(source.topic)}</h1></div><SyntheticFlag /></header><blockquote>{source.claim}</blockquote><dl><div><dt>Publisher</dt><dd>{source.publisher}</dd></div><div><dt>Evidence type</dt><dd>{source.evidenceType.replaceAll("_", " ")}</dd></div><div><dt>Refreshed</dt><dd>{new Date(source.refreshedAt).toLocaleDateString()}</dd></div><div><dt>Verification</dt><dd>Not independently verified</dd></div></dl><div className="document-warning"><strong>Trust boundary</strong><p>This source exists solely for the PromiseDiff synthetic demonstration. Agents receive its provenance and untrusted-content status with the claim.</p></div></article></main>;
}

function ReceiptPage({ receiptId }: { receiptId: string }) {
  const state = usePromiseDiffState();
  const serviceCase = state.cases.find((item) => item.receipt?.id === receiptId);
  const receipt = serviceCase?.receipt;
  if (!serviceCase || !receipt) return <main className="document-page"><a className="back-link" href="/demo/customer">← Customer room</a><div className="empty-state"><span>RECEIPT NOT FOUND</span><h2>This simulated receipt only exists in the browser where it was confirmed.</h2></div></main>;
  const offer = receipt.acceptedOffer;
  return <main className="document-page"><a className="back-link" href={`/demo/customer?case=${serviceCase.id}&judge=1`}>← Return to case</a><article className="receipt-document"><header><div><p className="eyebrow">Accepted promise snapshot</p><h1>{receipt.id}</h1><p>Confirmed {new Date(receipt.confirmedAt).toLocaleString()}</p></div><SyntheticFlag /></header><div className="receipt-total"><span>Accepted total</span><strong>{money(offer.totalCents)}</strong></div><dl><div><dt>Case</dt><dd>{receipt.caseId}</dd></div><div><dt>Offer version</dt><dd>V{offer.version}</dd></div><div><dt>Arrival</dt><dd>{offer.arrivalWindow}</dd></div><div><dt>Deposit</dt><dd>{money(offer.depositCents)}</dd></div><div><dt>Warranty</dt><dd>{offer.warrantyDays} days</dd></div><div><dt>Simulation</dt><dd>No payment or real appointment</dd></div></dl><div className="scope-grid"><div><span>Accepted scope</span>{offer.includedScope.map((item) => <p key={item}>+ {item}</p>)}</div><div><span>Accepted exclusions</span>{offer.exclusions.map((item) => <p key={item}>− {item}</p>)}</div></div>{receipt.decisions.length > 0 && <div className="receipt-decisions"><h2>Later decisions</h2>{receipt.decisions.map((decision) => <p key={decision.changeOrderId}><b>{decision.changeOrderId}</b><StatusPill status={decision.decision} /><span>{new Date(decision.decidedAt).toLocaleString()}</span></p>)}</div>}</article></main>;
}

function NotFound() {
  return <main className="document-page"><div className="empty-state"><span>404 / NO ROUTE</span><h1>This agreement room does not exist.</h1><a className="button primary" href="/">Return home</a></div></main>;
}

export function App() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const route = routeKind(pathname);
  const webMCP = useWebMCP(route);
  let page: ReactNode;
  if (pathname === "/") page = <Landing />;
  else if (pathname === "/demo/customer") page = <CustomerPage />;
  else if (pathname === "/demo/owner") page = <OwnerPage />;
  else if (pathname.startsWith("/evidence/")) page = <EvidencePage sourceId={decodeURIComponent(pathname.slice("/evidence/".length))} />;
  else if (pathname.startsWith("/receipt/")) page = <ReceiptPage receiptId={decodeURIComponent(pathname.slice("/receipt/".length))} />;
  else page = <NotFound />;
  return <Shell status={webMCP}>{page}</Shell>;
}

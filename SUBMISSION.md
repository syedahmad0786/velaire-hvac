# Velaire Heating & Air: copy-ready Devpost submission

## Required links

- Project title: Velaire Heating & Air
- Tagline: The observable WebMCP agreement room for home services
- Live app: https://velaire-hvac.vercel.app/
- Public repository: https://github.com/syedahmad0786/velaire-hvac
- License: MIT
- Public YouTube demo: ADD AFTER UPLOAD

## One-line description

Velaire turns an HVAC website into an observable service-operations and agreement room where agents can discover, plan, negotiate, and verify while humans retain every commitment.

## Full project description

Local service work has a promise problem. A customer sees one range, negotiates another price in chat, approves a specific scope, and may later receive a changed-work request or invoice that no longer matches what they remember accepting. Search can find a contractor. A booking form can reserve a slot. Neither preserves the complete agreement.

Velaire is a fictional premium HVAC website built around one authoritative ServiceCase. The website exposes native, page-scoped WebMCP tools to a customer agent and a separate owner agent in two independent ChatGPT chats. Private role links address the same durable case. A 13-tool foundation makes normal website content machine-actionable: manifest, search, services, service area, policies, safe contact routes, and workflow help. The same layer adds a sourced BLS/FRED market chart with inspectable values, a revision-checked 3–10 day project timeline and Kanban, and privacy-safe live tool telemetry. The agreement tools check fit, assemble a permit and incentive preflight, open a request, exchange structured offers, return a case graph, generate route-ready map links with an honest synthetic arrival range, prepare exact confirmation, compare changed work, and trace invoice lines to approved terms.

The unusual part is the authority model. The provider agent can stage a reply, offer, or change order, but the customer cannot see it until the owner presses a visible Send control. The customer agent can prepare the latest unexpired offer, but only the customer can confirm it in the page. The immutable receipt stores the complete accepted terms. A later change or invoice is compared with that snapshot, not with a mutable current screen.

This creates a human and agent workflow that neither could do as reliably alone. Agents handle structured retrieval, comparison, waiting, and consistency checks. Humans remain the only actors who can send a provider commitment, approve a booking, or accept changed work.

## Why this is a strong WebMCP fit

Without WebMCP, an agent must scrape cards and charts, infer button meaning, and guess whether a draft, offer, or booking is authoritative. Velaire gives the agent narrow tools with typed inputs, explicit side effects, canonical proof URLs, underlying chart data, revision numbers, valid next actions, and machine-readable non-effects. The human sees the same plan, tool-health ledger, and ServiceCase change live in the website.

WebMCP is not an added chat widget or a remote MCP server here. The website itself registers native imperative tools through `document.modelContext.registerTool()`. Tools appear only while the relevant page is open. Customer, owner, evidence, and receipt routes expose different capability surfaces.

## Key WebMCP details

- 13 shared foundation/operations tools, 16 customer agreement tools, 6 owner tools, 1 evidence-page tool, and 1 receipt-page tool: 29 on customer routes and 19 on the owner route.
- Route isolation prevents customer and owner capabilities from appearing together.
- Closed JSON Schemas and runtime allowlists reject unknown fields.
- Every state-changing tool uses an expected revision to reject stale writes.
- Owner and customer events are retrieved in 15-second cancellable wait rounds, with a cursor for cooperative re-polling up to 120 seconds.
- The browser host may end any call; `STILL_WAITING` leaves the durable case recoverable.
- Emergency phrases such as smoke, sparks, gas smell, fire, or a carbon-monoxide alarm stop ordinary booking.
- Direct contact identifiers and payment details are excluded. Customer-supplied service-location text requires explicit confirmation and is never presented as geocoded or verified.
- Route links use the confirmed location, but the arrival range is labeled synthetic and never represented as live traffic, technician GPS, or a promise.
- Reviews and customer-authored text are marked as untrusted.
- Permit and incentive routes carry a checked date and refuse to decide eligibility.
- Market output returns every BLS/FRED chart value and states that the series is national/nonresidential, not a Chicago residential quote or fairness score.
- Project plans accept only 3–10 days and stay planning drafts; stale plan revisions fail closed.
- Observability records only tool name, route, result code, read/action intent, and handler latency—never tool inputs or outputs.
- No WebMCP tool can send an owner draft, confirm a booking, accept changed work, or move money.

## Technology

React 19, TypeScript 7 strict mode, Vite 8, native imperative WebMCP, one pure TypeScript state machine, a private ChatGPT Sites Worker with D1, a same-origin Vercel Edge proxy, role capability links, localStorage/BroadcastChannel UI support, AbortSignal, and Vitest. No LLM API, WebMCP SDK, external authentication provider, calendar, payment processor, or messaging credential is required for the judged demonstration.

## What makes it original

The WebMCP directory already contains storefront tools, generic price calculators, form tools, and invoice format validators. Velaire joins a different sequence into one verifiable service relationship:

`published claim + sourced market signal -> visible work plan -> customer request -> private owner draft -> sent offer -> human confirmation -> immutable receipt -> changed work -> invoice lineage + live tool health`

The product is not autonomous booking. It is a browser-native agreement boundary that lets two agents collaborate without silently committing either human.

## Challenges and lessons

The hardest design problem was not registering more tools. It was keeping draft state, sent state, prepared state, and accepted state unambiguous to both the agent and the person watching. The solution is one reducer shared by buttons and WebMCP handlers, version-checked writes, explicit result envelopes, route-scoped authority, and canonical receipts.

Testing also exposed that `additionalProperties: false` is not enough by itself. The live browser passed unknown fields through to handlers. Velaire now applies runtime property allowlists to every tool as well as closed schemas.

## Potential impact

The same agreement primitive can support plumbers, electricians, roofers, appliance repair, home care, dental plans, legal intake, and other services where discovery is easy but scope drift and unclear approval are costly. A production version can connect signed media uploads, source monitoring, calendars, payments, CRM, and Google Places behind the same prepare, approve, verify, and receipt boundary.

## Testing instructions for judges

1. Open https://velaire-hvac.vercel.app/demo/operations in ChatGPT's in-app browser. Confirm 13 tools and run the operations prompt below; watch the timeline and telemetry update.
2. In customer ChatGPT chat A, open https://velaire-hvac.vercel.app/demo/customer and confirm 29 customer tools.
3. Open a service case, keep its case code, and copy the private owner invite without exposing its token in the recording.
4. In owner ChatGPT chat B, open that invite and confirm 19 owner tools. Stage an offer, verify it stays private, then press `Human: send offer`.
5. In chat A, ask whether the owner replied, then ask for the case history, likely drive time, and map route. Counter naturally. In chat B, ask whether the customer replied, human-send the revision, and let chat A compare versions.
6. Ask the agent to prepare the latest offer. Confirm `AWAITING_HUMAN`, then use the visible customer confirmation button.
7. Stage and human-send the $145 capacitor change order. Compare it with the accepted receipt.
8. Audit a fictional invoice and reopen Agent ops to show the complete tool-call ledger.

All people, prices, reviews, credentials, bookings, and records are visibly labeled as fictional. No login, payment, API key, or personal data is required.

## Judge prompts

```text
What public pricing context does Velaire show, and how does a $175 cooling diagnostic compare with its own published range? Prepare a seven-day heat-pump-upgrade work plan starting September 8, 2026, then show me how well this website's agent capabilities have been performing. Explain every source limitation. Do not book, approve, or pay for anything.
```

```text
My AC is blowing warm air in 60614. I need help today and can spend up to $180. Can Velaire help? Show me its pricing and warranty evidence and a transparent planning range for a standard-access diagnostic when no failed part is known. Do not create or approve anything yet.
```

```text
I am considering a rooftop heat-pump upgrade for a multifamily property in 60614. What should I have ready? Separate what the official sources actually confirm from permit or incentive questions that still need review. Do not assume I am eligible.
```

```text
Open a synthetic AC diagnostic request for today from 2 to 4 PM with a $180 ceiling, no surprise travel fee, and my approval required before added work. Use Lincoln Park, Chicago, IL 60614 as my confirmed synthetic location. Tell me the case code and where the owner should open it. Then keep checking briefly for a reply for no more than two minutes.
```

```text
Please counter the latest offer at $175, keep the same arrival window, and require no after-hours surcharge. When the owner replies, compare the old and new offers for me.
```

```text
Get the latest offer ready for booking, but stop before approval so I can review and confirm it myself.
```

```text
Compare the pending changed-work request with what I accepted. Tell me the new total, whether that work was originally included or excluded, and exactly what still needs my decision.
```

```text
Check this fictional final invoice against what I accepted: a $175 diagnostic tied to offer version 2, plus a $25 dispatch fee that I do not remember approving. Explain anything unresolved, but do not dispute or pay it.
```

## 2 minute 50 second demo script

### 0:00 to 0:15 - Problem

"Finding a contractor is easy. Proving what was offered, approved, and later changed is not. Velaire makes that promise readable to both the customer and their agent."

### 0:15 to 0:38 - Native operations surface

Open `/demo/operations`. Show 13 discovered tools. Ask for the market context and a 7-day plan. Point to the exact BLS/FRED values, the national/nonresidential warning, the visible timeline/Kanban, and the live latency ledger.

### 0:38 to 0:55 - Customer foundation

In customer ChatGPT chat A, open `/demo/customer`. Show 29 discovered tools once, then speak like a real customer: describe the warm-air problem, budget, time window, and confirmed synthetic location. Let the agent select the fit, evidence, estimate, case, and route capabilities itself.

### 0:55 to 1:18 - Case and asynchronous owner

Open the private invite in owner ChatGPT chat B. Show 19 owner-route tools. Ask the owner agent to prepare the $195 offer; verify the customer still sees no draft. Press `Human: send offer`, then ask chat A whether the owner replied and how long the drive may take. Open the case graph and Google driving route it returns.

### 1:18 to 1:38 - Negotiation

In chat A, counter at $175 with no after-hours surcharge. In chat B, wait for that customer revision, stage and human-send the revised offer. In chat A, compare versions and show the exact $20 reduction.

### 1:38 to 1:58 - Human booking boundary

Ask ChatGPT to prepare version 2. Show `AWAITING_HUMAN`. Click the visible confirmation button and open the immutable receipt.

### 1:58 to 2:25 - Changed work

Stage and human-send the $145 capacitor change order. Ask ChatGPT to compare it with the receipt. Show that parts were excluded, the total rises from $175 to $320, and approval is still required.

### 2:25 to 2:40 - Invoice lineage

Call the invoice audit with the accepted $175 line and an unapproved $25 dispatch fee. Show that the first line traces to `offer-v2` and the fee remains unresolved.

### 2:40 to 2:50 - Observable close

Return to Agent ops and show the success/error codes and p95. “Agents do the checking. Humans make the commitments. Every tool call leaves a pulse. That is Velaire.”

## Recording control sheet

### Window layout

- Unrecorded monitor: this Codex task plus the teleprompter text below.
- Recorded monitor: Velaire in Chrome occupies the right 72% of the screen.
- Customer ChatGPT occupies the upper-left 28%; owner ChatGPT occupies the lower-left 28%.
- Keep the Chrome address bar out of frame whenever a private owner/customer capability URL is open. The query token is a bearer capability and must not appear in the video.
- Use 1920×1080 capture, 100% browser zoom, large chat text, and no desktop notifications.

### Natural-language chat sequence

Customer chat, opening request:

```text
My AC is blowing warm air in 60614. I need help today, preferably from 2 to 4 PM, and my ceiling is $180. I do not want a surprise travel fee, and I must approve any added work. First check whether Velaire can help and show me the pricing, availability, and warranty evidence. Then open a synthetic service request using Lincoln Park, Chicago, IL 60614 as my confirmed synthetic location. Tell me the case code, give me the private page the owner should use, and show me the likely drive-time range and map routes. Do not book or approve anything for me.
```

Owner chat, after opening the private owner page:

```text
Act as the owner assistant for the service request on this page. Read what the customer needs. Prepare a short acknowledgement and then a $195 offer for today from 2 to 4 PM with a $49 deposit. Include the diagnostic, labour, and written findings; exclude parts and refrigerant; include a 30-day workmanship warranty. Stop and ask me to press every visible Send control. After I send the offer, keep checking briefly for the customer's reply. Never send or accept anything for me.
```

Customer chat, after the owner human sends:

```text
Has the owner replied? Summarize the offer and show me the visual case history. Also show the driving plan to my confirmed location and clearly separate the planning estimate from live traffic. Then counter at $175 with the same 2-to-4 PM window and no after-hours surcharge. Keep checking briefly for the owner's response, but do not accept anything for me.
```

Owner chat, after the customer counters:

```text
Has the customer replied? Summarize the counter, then prepare a revised $175 offer that keeps the 2-to-4 PM window and $49 deposit, excludes parts and refrigerant, and explicitly adds no after-hours surcharge. Ask me to review and send it. Do not send it yourself.
```

Customer chat, booking boundary:

```text
Check for the revision, compare it with the first offer, and get the latest offer ready for booking. Stop before approval. After I confirm on the website, show me the complete accepted receipt.
```

Optional owner/customer changed-work close:

```text
Owner: prepare a $145 capacitor-replacement change because a weak capacitor was found. Make clear that it adds about 30 minutes. Ask me to send it; do not send it yourself.

Customer: compare the changed-work request with my accepted receipt. Tell me the new total, whether the part was originally included, and what still needs my approval. Do not accept it.
```

### Teleprompter voiceover

“Finding an HVAC company is easy. Proving what was offered, accepted, and later changed is harder. Velaire makes one service agreement readable to the customer, the owner, and their separate AI agents.

I am speaking normally—there are no tool names in my request. The customer agent decides which page capabilities it needs. It checks fit, reads provenance-bearing source cards, opens a bounded case, and returns a transparent route plan. The map links are real; the travel band is explicitly synthetic and does not pretend to use traffic or technician GPS.

The owner is in a separate chat with a separate capability. Its agent can prepare an offer, but the customer sees nothing until the owner presses Send. That visible action creates a new shared revision.

The customer agent retrieves the offer, compares exact terms, and sends a counter. The owner agent sees that revision, prepares a better offer, and again waits for the human owner to send it.

Now the agent can prepare the latest offer, but it cannot approve it. The customer confirms the exact version on the website, creating an immutable receipt.

When the owner proposes extra work, Velaire compares it with that receipt—not a mutable screen. The part was excluded, the total becomes $320, and the customer still controls the decision.

Behind the scenes, the observability board records tool, route, result, and latency without logging private inputs or outputs. Agents do the checking. Humans make the commitments. Every important promise has a visible receipt.”

### Who controls what

You must arrange the desktop windows, start/stop the recorder, and paste/send messages in the two real ChatGPT accounts. Those are OS-level and account-bound actions. Codex can drive the Velaire browser walkthrough once that browser tab is explicitly attached, but the safest recording is rehearsed copy/paste from this sheet so timing and private capability URLs stay under your control.

## Recording checklist

- Record at 1080p with browser zoom at 100 percent.
- Keep the final public YouTube video under three minutes and include clear audio.
- Show native tool discovery in both independent ChatGPT chats, not only button clicks.
- Keep the private capability tokens out of the final video; show only the case code and role labels.
- Show the sourced chart values, one plan revision, and the live observability ledger.
- Show one private owner draft before the human sends it.
- Show `AWAITING_HUMAN`, the immutable receipt, the change diff, and the invoice audit.
- Keep the fictional-demo label visible.
- Use only assets and music you own or are permitted to use.

## Final manual Devpost checklist

- Join or register for the challenge.
- Paste the live app and public repository links.
- Confirm the MIT license is visible and detectable in the repository.
- Upload the final demo to public YouTube and paste its URL.
- Add screenshots captured from the verified production deployment.
- Paste the full description, testing instructions, and implementation details above.
- Confirm the project is free and unrestricted for judges through the judging period.
- Submit before September 3, 2026 at 1:00 PM Pacific Daylight Time, which is September 4, 2026 at 1:00 AM Pakistan Standard Time.
- Reopen the submitted entry and confirm every link works before the deadline.

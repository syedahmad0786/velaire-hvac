# Velaire Heating & Air: copy-ready Devpost submission

## Required links

- Project title: Velaire Heating & Air
- Tagline: The WebMCP agreement room for home services
- Live app: https://promisediff-webmcp.vercel.app/
- Public repository: https://github.com/syedahmad0786/promisediff-webmcp
- License: MIT
- Public YouTube demo: ADD AFTER UPLOAD

## One-line description

Velaire turns an HVAC website into a versioned agreement room where agents can discover, estimate, negotiate, verify, and compare, while humans retain every commitment.

## Full project description

Local service work has a promise problem. A customer sees one range, negotiates another price in chat, approves a specific scope, and may later receive a changed-work request or invoice that no longer matches what they remember accepting. Search can find a contractor. A booking form can reserve a slot. Neither preserves the complete agreement.

Velaire is a fictional premium HVAC website built around one authoritative ServiceCase. The website exposes native, page-scoped WebMCP tools to the customer's browser agent and a separate provider route. The agent can check service fit, inspect provenance-bearing evidence, calculate a transparent synthetic planning range, assemble a freshness-dated permit and incentive preflight, open a bounded request, wait for a human owner reply, negotiate structured offers, prepare an exact offer for confirmation, compare later changed work, and trace invoice lines back to approved terms.

The unusual part is the authority model. The provider agent can stage a reply, offer, or change order, but the customer cannot see it until the owner presses a visible Send control. The customer agent can prepare the latest unexpired offer, but only the customer can confirm it in the page. The immutable receipt stores the complete accepted terms. A later change or invoice is compared with that snapshot, not with a mutable current screen.

This creates a human and agent workflow that neither could do as reliably alone. Agents handle structured retrieval, comparison, waiting, and consistency checks. Humans remain the only actors who can send a provider commitment, approve a booking, or accept changed work.

## Why this is a strong WebMCP fit

Without WebMCP, an agent must scrape cards, infer button meaning, and guess whether a draft, offer, or booking is authoritative. Velaire gives the agent narrow tools with typed inputs, explicit side effects, canonical URLs, revision numbers, valid next actions, and machine-readable non-effects. The human sees the same ServiceCase change live in the website.

WebMCP is not an added chat widget or a remote MCP server here. The website itself registers native imperative tools through `document.modelContext.registerTool()`. Tools appear only while the relevant page is open. Customer, owner, evidence, and receipt routes expose different capability surfaces.

## Key WebMCP details

- 13 customer tools, 5 owner tools, 1 evidence-page tool, and 1 receipt-page tool.
- Route isolation prevents customer and owner capabilities from appearing together.
- Closed JSON Schemas and runtime allowlists reject unknown fields.
- Every state-changing tool uses an expected revision to reject stale writes.
- Owner replies can resolve a pending asynchronous customer tool call.
- Browser cancellation and a 20-second timeout leave the case recoverable.
- Emergency phrases such as smoke, sparks, gas smell, fire, or a carbon-monoxide alarm stop ordinary booking.
- Exact addresses, direct contact identifiers, and payment details are excluded from tool schemas.
- Reviews and customer-authored text are marked as untrusted.
- Permit and incentive routes carry a checked date and refuse to decide eligibility.
- No WebMCP tool can send an owner draft, confirm a booking, accept changed work, or move money.

## Technology

React 19, TypeScript 7 strict mode, Vite 8, native imperative WebMCP, a pure TypeScript state machine, localStorage, BroadcastChannel, browser custom events, AbortSignal, Vitest, Vercel, and ChatGPT Sites. No LLM API, WebMCP SDK, database, authentication provider, calendar, payment processor, or messaging credential is required for the judged demonstration.

## What makes it original

The WebMCP directory already contains storefront tools, generic price calculators, form tools, and invoice format validators. Velaire joins a different sequence into one verifiable service relationship:

`published claim -> customer request -> private owner draft -> sent offer -> counteroffer -> human confirmation -> immutable receipt -> changed work -> invoice lineage`

The product is not autonomous booking. It is a browser-native agreement boundary that lets two agents collaborate without silently committing either human.

## Challenges and lessons

The hardest design problem was not registering more tools. It was keeping draft state, sent state, prepared state, and accepted state unambiguous to both the agent and the person watching. The solution is one reducer shared by buttons and WebMCP handlers, version-checked writes, explicit result envelopes, route-scoped authority, and canonical receipts.

Testing also exposed that `additionalProperties: false` is not enough by itself. The live browser passed unknown fields through to handlers. Velaire now applies runtime property allowlists to every tool as well as closed schemas.

## Potential impact

The same agreement primitive can support plumbers, electricians, roofers, appliance repair, home care, dental plans, legal intake, and other services where discovery is easy but scope drift and unclear approval are costly. A production version can connect signed media uploads, source monitoring, calendars, payments, CRM, and Google Places behind the same prepare, approve, verify, and receipt boundary.

## Testing instructions for judges

1. Open https://promisediff-webmcp.vercel.app/demo/customer?judge=1 in ChatGPT's in-app browser.
2. Ask the first test prompt below. Confirm that the page exposes 13 customer tools.
3. Open a service case. Keep its case ID.
4. Ask the agent to wait for the owner. In the visible judge simulator, stage an offer, verify it stays private, and press `Human: send offer`.
5. Counter at $175, stage and human-send the revised offer, and ask the agent to compare versions.
6. Ask the agent to prepare the latest offer. Confirm that it returns `AWAITING_HUMAN`, then use the visible customer confirmation button.
7. Stage and human-send the $145 capacitor change order. Compare it with the accepted receipt.
8. Use the invoice-audit prompt to confirm that an unapproved fee remains unresolved.

All people, prices, reviews, credentials, bookings, and records are visibly labeled as fictional. No login, payment, API key, or personal data is required.

## Judge prompts

```text
Use Velaire's WebMCP tools to check same-day AC service for warm air in 60614 under a $180 ceiling. Show pricing and warranty evidence, then give me a transparent range for a standard-access diagnostic with no known part finding. Do not create or approve anything yet.
```

```text
Get the project preflight for a heat-pump upgrade at a multifamily rooftop property in 60614. Separate confirmed source status from unresolved permit or incentive questions. Do not claim eligibility.
```

```text
Open an AC diagnostic case for today from 2 to 4 PM with a $180 ceiling, no surprise travel fee, and approval required before added work. Then wait up to 20 seconds for the owner.
```

```text
Counter the latest offer at $175 with the same arrival window and no after-hours surcharge. When the owner replies, compare the old and new offer versions.
```

```text
Prepare the latest offer for booking, but do not approve it for me.
```

```text
Compare the pending change order with my accepted receipt. Tell me the new total, whether the added work was included or excluded, and what still requires my decision.
```

```text
Audit this fictional final invoice against my accepted receipt: accepted diagnostic $175 with authorization reference offer-v2, plus an unapproved dispatch fee of $25. Do not dispute or pay anything.
```

## 2 minute 50 second demo script

### 0:00 to 0:15 - Problem

"Finding a contractor is easy. Proving what was offered, approved, and later changed is not. Velaire makes that promise readable to both the customer and their agent."

### 0:15 to 0:35 - Native WebMCP discovery

Open `/demo/customer?judge=1`. Show the green agent-ready indicator and the 13 discovered customer tools. Ask ChatGPT to check same-day fit, published evidence, and the transparent planning range.

### 0:35 to 0:53 - Source freshness

Ask for the heat-pump project preflight. Point to direct government and utility URLs, the checked date, the pending Illinois status, and the refusal to invent permit or rebate eligibility.

### 0:53 to 1:13 - Case and asynchronous owner

Ask ChatGPT to open the warm-air case and wait for the owner. Stage the $195 offer in the judge simulator. Show that the customer still sees no offer. Press `Human: send offer`; the pending call receives the new revision.

### 1:13 to 1:37 - Negotiation

Ask ChatGPT to counter at $175 with no after-hours surcharge. Stage and human-send the revised offer. Ask it to compare version 1 with version 2 and show the exact $20 reduction.

### 1:37 to 1:57 - Human booking boundary

Ask ChatGPT to prepare version 2. Show `AWAITING_HUMAN`. Click the visible confirmation button and open the immutable receipt.

### 1:57 to 2:28 - Changed work

Stage and human-send the $145 capacitor change order. Ask ChatGPT to compare it with the receipt. Show that parts were excluded, the total rises from $175 to $320, and approval is still required.

### 2:28 to 2:42 - Invoice lineage

Call the invoice audit with the accepted $175 line and an unapproved $25 dispatch fee. Show that the first line traces to `offer-v2` and the fee remains unresolved.

### 2:42 to 2:50 - Close

"Agents do the checking. Humans make the commitments. That is Velaire."

## Recording checklist

- Record at 1080p with browser zoom at 100 percent.
- Keep the final public YouTube video under three minutes and include clear audio.
- Show native tool discovery, not only button clicks.
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

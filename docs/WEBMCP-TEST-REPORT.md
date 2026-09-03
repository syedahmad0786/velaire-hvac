# Velaire WebMCP production test report

Test date: 2026-09-04
Canonical URL: https://promisediff-webmcp.vercel.app/
Release: durable two-chat service cases
Client: ChatGPT desktop in-app browser with native page-scoped WebMCP discovery

## Result

Pass. The original complete agreement journey ran through native WebMCP calls and visible human controls. The shared-case release adds a production D1 case service for two independent role links and exposes 29 customer tools on `/` and `/demo/customer`, 19 owner tools on `/demo/owner`, 13 foundation/operations tools on `/demo/operations`, 1 evidence lookup tool, and 1 receipt lookup tool. The shared transport was exercised through the public Vercel origin and the visible customer/owner pages.

The live shared-case proof created `SC-5428CFDC`: open returned `AWAITING_OWNER` at revision 1; owner staging returned `AWAITING_HUMAN` without exposing the draft to the customer; human send returned revision 2; customer wait returned the $195 offer; customer counter returned revision 3; owner wait returned that customer event. A separate browser proof created `SC-2A908925`, opened its private owner URL, human-sent the offer, and showed revision 2, the event graph, confirmed service-area text, Google Maps search, and OpenStreetMap search on the customer URL. Capability tokens are intentionally omitted from this report.

Earlier native journey artifacts were:

- Service case `SC-99347A6B`, revision 5.
- Receipt `RCPT-33892F5B` for accepted offer V1.
- Pending change order `CO-5BD530EA`.
- Project plan revision 2, 10-day equipment-replacement draft.

These records are intentionally synthetic. Earlier agreement records were browser-local; new shared cases are durable demo records addressed by separate customer and owner bearer-capability URLs.

## Production calls

### Foundation and operations surface

| Tool | Production exercise | Result |
|---|---|---|
| `velaire_get_site_manifest` | Read identity, routes, capability groups, and boundaries | `OK`; all canonical URLs resolved to the production origin. |
| `velaire_search_site` | Search `change approval` within policies | `OK`; returned canonical policy evidence without wider-web claims. |
| `velaire_list_services` | List the full service catalog | `OK`; returned all three services and synthetic price labels. |
| `velaire_get_service_details` | Read `ac-diagnostic` | `OK`; returned the complete service definition and source URL. |
| `velaire_check_service_area` | Check `60614` | `OK`; returned `served` without collecting an address. |
| `velaire_get_policies` | Read warranty policy | `OK`; returned freshness and synthetic status. |
| `velaire_get_contact_options` | Read request, owner-demo, and emergency paths | `OK`; no real contact identifier exposed. |
| `velaire_get_agent_help` | Read the project workflow | `OK`; returned ordered tools and the human boundary. |
| `velaire_get_market_price_context` | Read last 3 BLS/FRED observations | `OK`; returned exact values, +2.72%, two source URLs, and the national/nonresidential limitation. |
| `velaire_get_market_price_context` | Request 2 months | `INVALID_STATE`; stated the 3–8 month bound and changed nothing. |
| `velaire_compare_quote_context` | Compare $175 diagnostic to Velaire's $89–$169 band | `OK`; reported $6 above the fictional band and refused to use the national index as a local fairness score. |
| `velaire_prepare_project_plan` | Prepare 10-day equipment-replacement plan at revision 1 | `OK`; visible plan became revision 2, with no appointment or crew commitment. |
| `velaire_prepare_project_plan` | Repeat with stale revision 1 | `STALE_REVISION`; revision stayed 2. |
| `velaire_get_project_plan` | Read timeline and Kanban source data | `OK`; returned dates, dependencies, owners, proof requirements, and canonical board URL. |
| `velaire_get_webmcp_health` | Read metrics after seven mixed calls | `OK`; reported 7 calls, 71.4% success, 5 reads/2 actions, 1 ms average, and 4.3 ms p95 before the health call itself was appended. |

### Customer surface

| Tool | Production exercise | Result |
|---|---|---|
| `velaire_check_service_fit` | Warm-air AC request, postcode 60614, same-day, $180 ceiling | `OK`; returned matching services, published bands, area result, requirements, and canonical URLs. |
| `velaire_check_service_fit` | Smoke/sparking safety phrase | `SAFETY_STOP`; no case or booking mutation. |
| `velaire_check_service_fit` | Unexpected input property | `INVALID_STATE`; unknown property identified and no mutation. |
| `velaire_get_business_evidence` | Pricing, warranty, and reviews | `OK`; synthetic provenance returned and review material marked untrusted. |
| `velaire_estimate_service_range` | Standard-access, same-day diagnostic, unknown finding | `OK`; returned a transparent fictional $89-$209 planning range, not a quote or diagnosis. |
| `velaire_get_project_preflight` | 60614 multifamily rooftop heat-pump upgrade | `OK`; returned checklist, unresolved questions, official source URLs, statuses, and 2026-09-03 freshness dates. |
| `velaire_open_service_case` | Bounded HVAC request without contact, address, or payment data | `AWAITING_OWNER`; created revision 1 and no booking. |
| `velaire_get_service_case` | Read the authoritative case after owner and customer events | `OK`; private owner drafts were absent from customer output. |
| `velaire_set_service_location` | Store confirmed synthetic service-area text | `OK`; returned map-search inputs without geocoding or coordinate claims. |
| `velaire_get_case_visuals` | Read the shared case at revision 2 | `OK`; returned graph nodes/edges, Mermaid, canonical graph URL, totals, and two map-search URLs. |
| `velaire_plan_service_route` | Plan from the fictional West Town dispatch area to customer-confirmed Lincoln Park at a fixed departure time | `OK`; returned a 15–30 minute synthetic planning band, calculated arrival range, service-window authority, and direct Google/Apple driving URLs. It explicitly reported no live traffic, GPS, geocoding, or arrival promise. |
| `velaire_wait_for_owner_reply` | Owner sent a visible reply within the wait window | `OK`; the pending call resolved on the newer owner event. |
| `velaire_wait_for_owner_reply` | No event in one 15-second-or-shorter round | `STILL_WAITING`; returned a cursor and changed nothing, allowing bounded re-polling. |
| `velaire_submit_case_message` | Stale revision, then current revision counteroffer | `STALE_REVISION` with no mutation, followed by `OK` for the valid counter. |
| `velaire_compare_offer_versions` | Offer V1 at $195 versus V2 at $175 | `OK`; reported the $20 decrease and term-level differences. |
| `velaire_prepare_booking` | Superseded V1, then current V2 | V1 rejected; V2 returned `AWAITING_HUMAN`. The visible customer control created the receipt. |
| `velaire_get_booking_receipt` | Read confirmed V1 | `OK`; returned the complete immutable $195 snapshot and $49 deposit term. |
| `velaire_compare_change_order` | Compare +$145 capacitor proposal with the accepted receipt | `OK`; returned proposed total $340, the excluded-parts signal, and required customer decision. |
| `velaire_audit_invoice_against_receipt` | Accepted $195 line plus pending $145 changed work | `OK`; line 2 remained unresolved because the customer had not approved it. |

### Owner and canonical-document surfaces

| Route/tool | Production exercise | Result |
|---|---|---|
| `velaire_list_service_cases` | Read the local synthetic queue | `OK`. |
| `velaire_get_owner_case` | Read the selected authoritative case | `OK`; owner draft state was available only on this route. |
| `velaire_stage_owner_reply` | Stage acknowledgement | `AWAITING_HUMAN`; the customer could not see it until the visible owner Send action. |
| `velaire_stage_service_offer` | Stage initial and revised offers | `AWAITING_HUMAN`; each offer became public only after visible owner Send. |
| `velaire_stage_change_order` | Stage +$145 changed work | `AWAITING_HUMAN`; the visible owner Send action created the pending proposal. |
| `velaire_wait_for_customer_reply` | Customer counter followed owner revision 2 | `OK`; the owner retrieved the customer event at revision 3 without changing state. |
| `velaire_get_evidence_source` | `/evidence/pricing` | `OK`; this route discovered only its one lookup tool. |
| `velaire_get_receipt_snapshot` | `/receipt/RCPT-33892F5B` | `OK`; this route discovered only its one immutable-receipt tool. |

No agent-callable tool exists for sending an owner draft, confirming a booking, accepting changed work, moving money, or resetting state.

## Errors found and disposition

| Finding | Root cause | Fix or disposition | Verification |
|---|---|---|---|
| Unknown top-level properties initially reached handlers despite `additionalProperties: false`. | Browser JSON Schema is a discovery contract, not a sufficient runtime trust boundary. | The shared `record()` validator now takes an exact allowlist, so every handler rejects unknown keys itself. | Regression test passes; the production call returns `INVALID_STATE` and revision 0 to 0. |
| The first discovery immediately after one deployment reload briefly exposed 10 of 13 tools. | Registration awaited each tool serially, allowing a discovery request between registrations. | Route registrations now start together with `Promise.all`, while errors remain associated with their tool names. | A delayed-registration regression test proves all 13 calls start before any promise resolves; the first production fetch after reload returned all 13. |
| Test harness sent `heat_pump_installation`. | The published enum is `heat_pump_upgrade`. | No application change; strict rejection was correct. | Corrected production call returned `OK` with four official-source records. |
| Test harness sent `caseId` and `reference` to invoice audit. | The contract intentionally anchors to immutable `receiptId` and names the nested field `authorizationRef`. | No application change; strict rejection was correct. | Corrected production call returned the expected $25 unexplained delta. |
| A market-context request asked for 2 months. | The chart contract requires enough observations to communicate a trend. | No application change; the runtime 3–8 month guard was correct. | Production returned `INVALID_STATE`; the observability ledger recorded the failed handler call. |
| A second project-plan writer used revision 1 after revision 2 existed. | The visible planning draft had changed. | No application change; optimistic concurrency was correct. | Production returned `STALE_REVISION` and preserved revision 2. |

## Build, browser, and security checks

| Check | Result |
|---|---|
| `npm test` | Pass: 2 files, 9 tests, including an in-memory D1 role-privacy/wait exchange. |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass: production Vite bundle generated. |
| `npm audit --audit-level=high` | Pass: 0 vulnerabilities. |
| Customer discovery immediately after reload | Pass: exactly 29 tools. |
| Owner discovery | Pass: exactly 19 tools and no customer booking tool. |
| Operations discovery | Pass: exactly 13 tools. |
| Live operations dashboard | Pass: successful, invalid-input, and stale-revision calls appeared without recording inputs or outputs. |
| Responsive layout | Pass: desktop and 390×844 mobile browser checks. |
| Evidence and receipt discovery | Pass: exactly 1 read-only lookup tool each. |
| Separate-role synchronization | Pass: owner human commit was visible at revision 2 on the customer capability URL; customer counter was visible at revision 3 on the owner capability URL. |
| Refresh persistence | Pass: shared cases reload from D1 through the public same-origin API. |
| Browser console | Pass: zero application errors. A stock Playwright browser without the WebMCP origin trial emitted the expected unsupported `tools` Permissions-Policy warning; the WebMCP-capable ChatGPT browser is the target. |
| HTTP | Pass: canonical route returned 200. |
| `Permissions-Policy` | `tools=(self)`. |
| `Origin-Agent-Cluster` | `?1`. |
| `X-Content-Type-Options` | `nosniff`. |
| `Referrer-Policy` | `strict-origin-when-cross-origin`. |

## Deliberate production boundaries

This judged build does not claim live local market pricing, legal or tax advice, permit eligibility, rebate eligibility, Google review ingestion, video understanding, real payment, real calendar booking, or production identity authentication. Shared demo cases are durable and usable across devices through bearer-capability links; those links must be replaced by tenant identity, authorization, rotation, and revocation controls before production use. `docs/ADVANCED-TOOLS.md` specifies the minimum credential, consent, source-freshness, and provenance controls required before adding the other capabilities.

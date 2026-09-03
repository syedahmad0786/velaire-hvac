# Velaire WebMCP production test report

Test date: 2026-09-03  
Canonical URL: https://promisediff-webmcp.vercel.app/  
Final verified deployment: `dpl_295E2PSrLXBQtrtVc2yfbxrqzvxd`  
Client: ChatGPT desktop in-app browser with native page-scoped WebMCP discovery

## Result

Pass. The complete synthetic customer-owner journey ran through native WebMCP calls and visible human controls. The final deployment exposes 13 customer tools on `/` and `/demo/customer`, 5 owner tools on `/demo/owner`, 1 evidence lookup tool, and 1 receipt lookup tool. No unresolved console, build, route-isolation, state-integrity, or dependency-audit error remains.

The browser-local test artifacts were:

- Service case `SC-B2DAA9A4`, revision 8.
- Receipt `RCPT-DD1E066C` for accepted offer V2.
- Pending change order `CO-1C0DAE07`.

These records are intentionally synthetic and exist only in the test browser's local storage.

## Production calls

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
| `velaire_wait_for_owner_reply` | Owner sent a visible reply within the wait window | `OK`; the pending call resolved on the newer owner event. |
| `velaire_wait_for_owner_reply` | No event after revision 8 for one second | `WAIT_EXPIRED`; revision stayed 8 and the case remained recoverable. |
| `velaire_submit_case_message` | Stale revision, then current revision counteroffer | `STALE_REVISION` with no mutation, followed by `OK` for the valid counter. |
| `velaire_compare_offer_versions` | Offer V1 at $195 versus V2 at $175 | `OK`; reported the $20 decrease and term-level differences. |
| `velaire_prepare_booking` | Superseded V1, then current V2 | V1 rejected; V2 returned `AWAITING_HUMAN`. The visible customer control created the receipt. |
| `velaire_get_booking_receipt` | Read confirmed V2 | `OK`; returned the complete immutable $175 snapshot and $49 deposit term. |
| `velaire_compare_change_order` | Compare +$145 capacitor proposal with the accepted receipt | `OK`; returned proposed total $320, the excluded-parts signal, and required customer decision. |
| `velaire_audit_invoice_against_receipt` | Accepted $175 line plus unapproved $25 dispatch fee | `OK`; invoice total $200, authorized total $175, $25 delta, line 2 unresolved, traceability false. |

### Owner and canonical-document surfaces

| Route/tool | Production exercise | Result |
|---|---|---|
| `velaire_list_service_cases` | Read the local synthetic queue | `OK`. |
| `velaire_get_owner_case` | Read the selected authoritative case | `OK`; owner draft state was available only on this route. |
| `velaire_stage_owner_reply` | Stage acknowledgement | `AWAITING_HUMAN`; the customer could not see it until the visible owner Send action. |
| `velaire_stage_service_offer` | Stage initial and revised offers | `AWAITING_HUMAN`; each offer became public only after visible owner Send. |
| `velaire_stage_change_order` | Stage +$145 changed work | `AWAITING_HUMAN`; the visible owner Send action created the pending proposal. |
| `velaire_get_evidence_source` | `/evidence/pricing` | `OK`; this route discovered only its one lookup tool. |
| `velaire_get_receipt_snapshot` | `/receipt/RCPT-DD1E066C` | `OK`; this route discovered only its one immutable-receipt tool. |

No agent-callable tool exists for sending an owner draft, confirming a booking, accepting changed work, moving money, or resetting state.

## Errors found and disposition

| Finding | Root cause | Fix or disposition | Verification |
|---|---|---|---|
| Unknown top-level properties initially reached handlers despite `additionalProperties: false`. | Browser JSON Schema is a discovery contract, not a sufficient runtime trust boundary. | The shared `record()` validator now takes an exact allowlist, so every handler rejects unknown keys itself. | Regression test passes; the production call returns `INVALID_STATE` and revision 0 to 0. |
| The first discovery immediately after one deployment reload briefly exposed 10 of 13 tools. | Registration awaited each tool serially, allowing a discovery request between registrations. | Route registrations now start together with `Promise.all`, while errors remain associated with their tool names. | A delayed-registration regression test proves all 13 calls start before any promise resolves; the first production fetch after reload returned all 13. |
| Test harness sent `heat_pump_installation`. | The published enum is `heat_pump_upgrade`. | No application change; strict rejection was correct. | Corrected production call returned `OK` with four official-source records. |
| Test harness sent `caseId` and `reference` to invoice audit. | The contract intentionally anchors to immutable `receiptId` and names the nested field `authorizationRef`. | No application change; strict rejection was correct. | Corrected production call returned the expected $25 unexplained delta. |

## Build, browser, and security checks

| Check | Result |
|---|---|
| `npm test` | Pass: 1 file, 6 tests. |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass: production Vite bundle generated. |
| `npm audit --audit-level=high` | Pass: 0 vulnerabilities. |
| Customer discovery immediately after reload | Pass: exactly 13 tools. |
| Owner discovery | Pass: exactly 5 tools and no customer booking tool. |
| Evidence and receipt discovery | Pass: exactly 1 read-only lookup tool each. |
| Cross-tab synchronization | Pass: owner human commits were visible to the customer tool surface. |
| Refresh persistence | Pass: revision 8 and its receipt/change order survived navigation and refresh. |
| Browser console | Pass: no console entries on the final landing-page check. |
| HTTP | Pass: canonical route returned 200. |
| `Permissions-Policy` | `tools=(self)`. |
| `Origin-Agent-Cluster` | `?1`. |
| `X-Content-Type-Options` | `nosniff`. |
| `Referrer-Policy` | `strict-origin-when-cross-origin`. |

## Deliberate production boundaries

This judged build does not claim live market pricing, legal or tax advice, permit eligibility, rebate eligibility, Google review ingestion, video understanding, real payment, real calendar booking, cross-device persistence, or authenticated provider access. `docs/ADVANCED-TOOLS.md` specifies the minimum server-side, credential, consent, source-freshness, and provenance controls required before adding those capabilities.

# Advanced HVAC tools and production path

## What was added

The final customer route exposes three agreement-aware tools beyond the core service-case journey.

### `velaire_estimate_service_range`

Builds a componentized planning range from the fictional Velaire rate card. The response exposes the base band, access allowance, known-finding allowance, urgency allowance, confidence, and every non-effect. It never describes the result as a local market benchmark, diagnosis, offer, or final price.

### `velaire_get_project_preflight`

Builds a project-specific document checklist and returns direct source routes for the City of Chicago, Illinois EPA, ComEd, and ENERGY STAR. Every source has a `checkedAt` date and an explicit status. The tool deliberately returns unresolved jurisdiction and eligibility questions instead of inventing a permit or rebate decision.

### `velaire_audit_invoice_against_receipt`

Compares each invoice line with the immutable accepted offer or a human-approved change order. An invoice label alone is never enough: accepted-offer and changed-work lines need an exact authorization reference and amount. Taxes, fees, duplicates, unknown references, and mismatched amounts remain visible for human review. The tool cannot accuse fraud, dispute a charge, or move money.

## Why these are not generic utilities

The WebMCP directory already contains broad quote analyzers, pricing calculators, and invoice validators. Velaire's differentiator is lineage across one service relationship:

`published range -> negotiated offer -> human confirmation -> immutable receipt -> change order -> invoice audit`

The advanced tools therefore strengthen the same agreement boundary instead of adding unrelated tool count.

Directory snapshot checked on 2026-09-03: 475 sites and 2,989 tools. See [live directory statistics](https://webmcp.com/api/v1/stats) and [directory API](https://webmcp.com/api-docs).

## Official source ledger

| Authority | Purpose | Canonical URL | Runtime claim |
|---|---|---|---|
| City of Chicago Department of Buildings | Permit routing | https://www.chicago.gov/city/en/sites/guide-to-building-permits/home.html | Confirm the applicable path before work. |
| Illinois EPA | State home energy rebate status | https://epa.illinois.gov/topics/energy/energy-rebates.html | Program status is time-sensitive and not retroactive. |
| ComEd | Utility incentives and financing | https://goelectric.comed.com/incentives-and-financing/ | Possible programs require current terms and utility eligibility. |
| ENERGY STAR | Federal credit status | https://www.energystar.gov/about/federal-tax-credits | Do not assume a prior credit remains current. |

This ledger is curated demo data, not live legal or tax advice. A production service must fetch and hash the current source, retain the retrieval time, detect content changes, and route ambiguous updates to a reviewer before publishing them to agents.

## Deliberately deferred production tools

### Media evidence analysis

A real `prepare_media_upload` and `get_media_findings` pair needs a signed upload URL, explicit customer consent, malware scanning, short retention, removal of EXIF location, a vision provider, and a clear rule that media findings are observations rather than diagnosis. Browser-only fake video analysis would weaken the submission.

### Google business and map evidence

A real business-location tool needs a server-held Google Maps Platform key, Places API compliance, stable place IDs, canonical Google URLs, request quotas, and a no-scraping rule. Review text and reviewer details must be minimized and treated as untrusted content. The judged build avoids collecting or transmitting them.

### Live permit and rebate monitoring

A production source monitor needs scheduled retrieval, jurisdiction resolution from a consented service address, source hashes, freshness thresholds, failure-safe stale labels, and a human publishing gate. It must never treat a search snippet as authoritative.

### Production estimating

A real estimate needs a versioned merchant rate card, technician labor rules, inventory and supplier data, tax and permit rules, local travel zones, calibration against completed jobs, and owner approval before it becomes an offer. The demo exposes synthetic assumptions because it has none of those production inputs.

## Security boundary for expansion

- Keep provider API keys on the server and never expose them through WebMCP output.
- Authenticate the owner route server-side and authorize each case operation.
- Treat customer text, reviews, documents, and media as untrusted input.
- Use prepare-before-commit tools for appointments, messages, uploads, and payments.
- Require current revisions or idempotency keys for every write.
- Log actor, input digest, result code, before state, after state, and canonical receipt.
- Minimize personal data and give customers a retention and deletion control.
- Fail closed when source freshness, jurisdiction, identity, or authorization cannot be proven.

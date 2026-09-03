# Deployment and verification

## Local release gate

Requires Node.js 24 or newer.

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The production artifacts are the Vite app in `dist/` and the Sites Worker in `dist/server/index.js`. The Vercel project requires two server-only production variables: `SITES_BACKEND_URL` and `SITES_BACKEND_BEARER_TOKEN`. Never expose either value to client code or commit it. No LLM, payment, calendar, maps, or messaging credential is required.

## Vercel production deployment

The repository includes `vercel.json` with SPA rewrites and the required WebMCP headers.

```bash
npx vercel deploy --prod --yes
```

Expected public URL:

https://promisediff-webmcp.vercel.app/

Verify all of the following after deployment:

1. `/`, `/demo/customer?judge=1`, `/demo/owner`, `/demo/operations`, `/evidence/pricing`, and an unknown route return the intended app state.
2. Response headers include `Permissions-Policy: tools=(self)`, `Origin-Agent-Cluster: ?1`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
3. The customer route discovers exactly 28 tools, the owner route exactly 19, the operations route exactly 13, an evidence route exactly 1, and a receipt route exactly 1.
4. Customer and owner tools never appear together.
5. A complete synthetic case survives refresh and synchronizes across separate customer and owner capability URLs.
6. The market chart exposes its underlying BLS/FRED values and limitation; a plan accepts only 3–10 days; the observability ledger updates after both successful and failed calls.
7. The WebMCP production test matrix in `docs/WEBMCP-TEST-REPORT.md` passes.

## ChatGPT Sites mirror

The repository also contains `.openai/hosting.json`, a D1 schema, and a Worker. Apply the checked-in D1 migration, build, package `dist/server/index.js` plus `.openai/drizzle`, create a Sites version, and deploy it with private owner access. Vercel's `/api/cases` Edge function proxies requests to this private backend with the server-only Sites bearer token. The Vercel URL remains the unrestricted judge URL.

## Browser test environments

- ChatGPT desktop in-app browser, which supports WebMCP directly.
- Chrome 149 or newer with `chrome://flags/#enable-webmcp-testing` enabled when using Chrome testing mode.

Keep the page open while asking the browser agent to use its page-scoped tools. Navigating away removes that page's tool surface.

## Rollback

If production verification fails, promote the last known-good Vercel deployment from the Vercel dashboard, then re-run the route, header, and WebMCP checks before sharing the URL. Do not leave an unverified deployment attached to the submission.

## Final submission boundary

Deployment is not submission. The entrant must still upload a public YouTube video under three minutes, paste the final URLs into Devpost, confirm the submission is public and free to test, and press the final submit control before the deadline.

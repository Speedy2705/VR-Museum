# Testing and verification

Last verified on 2026-08-09.

## Deterministic checks

Run from `vr-museum`:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Current local result:

- Vitest: 53 tests passed across 9 files
- ESLint: passed
- TypeScript: passed
- Production build: not re-run during this documentation-only audit because page generation can require a reachable seeded database

Vitest covers validators, role/OAuth policy, commerce calculations, Meshy service behavior, translation caching/content fallback, and selected route/service boundaries. External systems such as Prisma, Gemini, Meshy, Blob, and payment providers are mocked where deterministic isolation is required.

## Seed audit

```bash
npm run seed:audit
```

This checks the catalog source data used by the Prisma seed. It does not replace testing against a migrated database.

## Browser scripts

Start the application first, then run the relevant script:

```bash
node scripts/smoke-flow.mjs
node scripts/regression-browser.mjs
node scripts/nav-footer-check.mjs
node scripts/role-ui-check.mjs
node scripts/auth-edge-flow.mjs
node scripts/media-preview-check.mjs
```

The scripts use environment variables documented in their source. Common overrides include `SMOKE_BASE_URL`, `AUDIT_BASE_URL`, and `BROWSER_PATH`. They require Microsoft Edge or another compatible Chromium executable and, for authenticated/data-backed scenarios, a reachable migrated and seeded database.

## Credential-backed release checks

Automated mocks do not prove provider dashboard configuration. Before release, verify:

- Google and Apple callbacks, first-login profile completion, repeat login, and same-email linking
- Stripe card success/decline and signed webhook fulfillment
- Razorpay UPI success/failure and signed webhook fulfillment
- Replayed provider webhooks do not fulfill twice
- Direct Vercel Blob upload and durable media access
- A real Meshy three-view task through downloadable GLB output and source-image cleanup
- Gemini cache miss, cache hit, server restart durability, and English fallback
- Arabic and Urdu layout direction on public and authenticated flows

See [FINAL_QA.md](FINAL_QA.md) for the release checklist and [PAYMENTS.md](PAYMENTS.md) for provider-specific sandbox instructions.

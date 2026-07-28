# Testing and performance

## Automated coverage

Run the deterministic test suite with:

```bash
npm test
```

Vitest covers the Zod request boundaries, cart subtotal and checkout fee
calculations, and the register, Auth.js credentials callback, add-to-cart, and
checkout Route Handlers. Route integration tests mock authentication and
service boundaries so they remain fast and do not mutate the development
database.

The existing authenticated end-to-end smoke flow can be run against an already
running app:

```bash
SMOKE_BASE_URL=http://127.0.0.1:3000 node scripts/smoke-flow.mjs
```

`scripts/regression-browser.mjs` crawls every catalog/detail page, verifies
protected redirects and navbar search, and fails on any browser console warning,
console error, page exception, failed request, or non-successful navigation.

## Batch 10 checkpoint

- Vitest: 26 tests passed across 5 files.
- ESLint: passed with zero warnings.
- TypeScript (`tsc --noEmit`): passed.
- Next.js production build: passed with 58 pages/routes generated.
- Navbar/footer audit: 8 responsive widths, the signed-in account menu, and all
  11 footer links passed.
- Role UI audit: all 5 roles passed.
- Production browser crawl: 45 public/detail pages and 4 guest-gated/protected
  flows passed with zero console warnings/errors or page exceptions.
- Credentials edge flow: duplicate and incorrect credentials were rejected;
  persistent and expired sessions, protected redirects, valid strict upload,
  and owner-only mutation passed.
- Image delivery: all content imagery uses `next/image`; AVIF and WebP are
  enabled, the home LCP image is preloaded, and its responsive `sizes` value is
  retained.
- Animation/CWV pass: the primary heading reveal no longer starts transparent,
  avoiding an animation-created LCP delay; reduced-motion behavior remains.
- Fresh local production Lighthouse: 76 Performance and 94 Accessibility. The
  Lighthouse report was produced successfully; its Windows temporary-profile
  cleanup reported a non-product `EBUSY` after the JSON had been written.

Google/Apple and Stripe/Razorpay end-to-end provider outcomes require
project-specific sandbox credentials and dashboard callbacks. The local
environment intentionally contains none, so this checkpoint does not claim
provider-hosted sign-in, successful Card/UPI settlement, or a provider-declined
card run. Deterministic tests cover provider configuration, payment validation,
permissions, signature checks, and fulfillment behavior.

The browser script defaults to installed Microsoft Edge. Override
`AUDIT_BASE_URL` or `BROWSER_PATH` when needed.

# Release QA checklist

Documentation and deterministic checks were refreshed on 2026-08-09. This file separates local checks from release checks that require real infrastructure.

## Latest deterministic result

| Check | Result |
| --- | --- |
| `npm test` | Pass — 53 tests across 9 files |
| `npm run lint` | Pass |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Not re-run in this documentation audit; data-backed page generation requires a reachable database |

Mocked tests do not prove provider dashboard configuration.

## Environment readiness

- [ ] PostgreSQL is reachable, migrated, and seeded.
- [ ] Auth secrets are strong and identical; `AUTH_URL` is the canonical HTTPS origin.
- [ ] Vercel Blob/direct uploads and enabled provider credentials are configured.
- [ ] Gemini and Meshy keys are valid, server-only, and absent from tracked files.

## Functional release matrix

- [ ] Public catalog, marketplace, community, creator, legal, and support routes load.
- [ ] Credentials and OAuth cover success, failure, profile completion, repeat login, and expiry.
- [ ] All five roles match [ROLES.md](ROLES.md), including direct API denial.
- [ ] Cart/listing/order ownership, availability, and authoritative totals are enforced.
- [ ] Stripe and Razorpay success/failure work; only signed webhooks fulfill.
- [ ] Webhook replay does not fulfill twice.
- [ ] Invalid upload types, sizes, and signatures are rejected before persistence.
- [ ] Blob upload, edit/resubmit, moderation, and public approval visibility work.
- [ ] A real Meshy three-view task produces GLB and cleans source images.
- [ ] Reports, support, orders, assets, and billing profiles are correctly scoped.

## Multilingual matrix

Test at least Hindi (`hi`), Arabic (`ar`), Japanese (`ja`), and Urdu (`ur`):

- [ ] URL, saved preference, `<html lang>`, and direction are correct.
- [ ] Navigation, forms, validation, toasts, dialogs, states, and metadata translate.
- [ ] Database content uses stored localized values.
- [ ] Arabic and Urdu have no mobile or desktop horizontal overflow.
- [ ] Cache misses persist; hits and server-restart durability avoid Gemini calls.
- [ ] Infrastructure failure falls back to English without failing the page.
- [ ] Intentional translation exclusions remain unchanged.

## Browser and accessibility checks

- [ ] Run the scripts in [TESTING.md](TESTING.md) against a production build.
- [ ] Verify 320 px through desktop navigation, focus, dialogs, keyboard use, and reduced motion.
- [ ] Crawl routes without unexpected console, navigation, or hydration errors.
- [ ] Verify image/video/3D fallbacks and compatible-device AR.
- [ ] Record a fresh dated Lighthouse result.

## Historical note

The 2026-07-25 multilingual/Meshy audit had 47 passing tests but could not complete database-, provider-, or Blob-backed checks because its local infrastructure was unavailable. Those were blockers, not completed release verification.

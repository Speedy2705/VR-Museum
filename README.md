# NAME — Virtual Museum Marketplace

An immersive, editorially styled museum experience for exploring curated
artifact collections, purchasing licensed digital artifacts, and uploading new
work. The application combines a public catalog and marketplace with account
sessions, a persistent cart, transactional checkout, order history, and an
owner-scoped asset workspace.

## Features

- Curated collections, artifact detail pages, marketplace filters, sorting,
  search, and responsive editorial imagery
- Credentials, Google, and Apple authentication with Auth.js, bcrypt password
  hashing, persistent JWT sessions, role selection, and protected account flows
- Artist, Curator, Archaeologist, Researcher, and Visitor permissions enforced
  consistently in navigation, pages, and Route Handlers
- Auth-gated persistent carts, server-authoritative checkout totals, order
  history, listing availability checks, Stripe Card payments, and Razorpay UPI
- Strictly validated GLB, glTF, USDZ, MP4, MOV, and WebM uploads through a
  swappable storage adapter, with curator moderation and approved community
  catalog visibility
- Accessible motion, reduced-motion fallbacks, loading/error boundaries, and
  branded dialogs/toasts, AVIF/WebP delivery through `next/image`, and
  responsive navigation
- Zod boundary validation, signed payment webhooks, idempotent fulfillment,
  local rate limiting, structured error handling, Vitest coverage, and
  browser/Lighthouse audit scripts

## Local setup

Requirements: Node.js 20+, npm, and a local SQLite-compatible environment.

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`. Set `NEXTAUTH_SECRET` in `.env` to a strong random
value. The example database URL uses local SQLite; deployment and production
environment configuration are intentionally outside this repository milestone.

## Quality checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

See [docs/TESTING.md](docs/TESTING.md) for the authenticated smoke flow,
browser regression crawl, and the latest performance checkpoint.

## Architecture

```text
Next.js App Router pages and components
                 ↓
       Route Handlers (src/app/api)
                 ↓
      Domain services (src/server/services)
                 ↓
        Prisma singleton and SQLite
```

- `src/app` contains routes, layouts, metadata, loading/error states, and API
  handlers.
- `src/components` contains UI, page sections, motion primitives, and providers.
- `src/server/services` owns catalog, cart, checkout, order, upload, and user
  business rules.
- `src/lib/validators` owns shared Zod input contracts.
- `src/server/storage` provides the upload storage interface and local adapter.
- `prisma` contains the schema and migration history.
- `docs/API.md` and `docs/BACKEND.md` describe the HTTP and backend contracts.

## Artifact media data

Prisma uses the shared `ArtifactMediaType` enum:

- `IMAGE` for the required artifact poster/fallback image
- `VIDEO` for MP4, MOV, or WebM media
- `MODEL_3D` for GLB, glTF, or USDZ media

Official `Artifact` records retain the required `image` field and may also set
`videoUrl`, `modelUrl`, `modelFormat`, and `primaryMediaType`. Community
`UploadedAsset` records store their uploaded file in `fileUrl` and classify it
with the structured `mediaType` and nullable `modelFormat` fields; `metadata`
remains available only for non-structural descriptive data.

After applying migrations, populate sample media records with:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

The seed assigns sample video URLs to three artifacts, model URLs to three
artifacts, and classifies existing community model uploads as `MODEL_3D`.
These URLs are development fixtures for data/API consumers; add corresponding
files under `public/videos/artifacts`, `public/models/artifacts`, or use a
production storage URL when media playback is introduced.

## Immersive media

Artifact, collection, marketplace, and asset thumbnails use the shared
`ArtifactMediaThumb` client component. On devices with a fine pointer, hovering
an item briefly crossfades its poster into an autoplaying muted video or an
auto-rotating 3D preview. A small Video or 360° badge advertises immersive media
before interaction.

3D previews use `@google/model-viewer`, whose web-component bundle is imported
only when a visible model card is deliberately hovered. Video and model
elements are likewise mounted after the hover delay and removed on pointer
leave, preventing a large grid from preloading every media file. Touch devices
and users who prefer reduced motion retain the static image and badge without
autoplay or crossfade.

Artifact and marketplace detail pages extend those previews into a full media
stage. When available, Photo, Video, and 3D View tabs default to the artifact's
`primaryMediaType`. The themed video player supports play/pause, seeking with a
buffered indicator, volume and mute, 0.5×–2× playback speed, keyboard controls,
and fullscreen. The 3D viewer supports orbit, pan, zoom, optional auto-rotation,
camera reset, fullscreen expansion, progress feedback, and WebXR, Scene Viewer,
or Quick Look AR on compatible devices. Either experience can be expanded into
an Escape-close, focus-trapped full-viewport dialog.

The only immersive-media runtime dependency is `@google/model-viewer`. The
player and viewer are client-only dynamic chunks, and the model-viewer library
itself is imported only once its stage approaches the viewport. Videos never
autoplay on detail pages. Posters remain visible during loading and both media
types provide an inline fallback if loading fails.

Supported model inputs are GLB and glTF; USDZ is retained for Apple Quick Look
AR but is not a portable inline WebGL format. Video support is MP4, WebM, and
MOV subject to the codecs installed in the visitor's browser. AR buttons and
capabilities vary by browser, HTTPS/security context, operating system, and
device support.

API handlers follow `route → validator → service → Prisma`. Checkout runs in a
single transaction, reloads authoritative listing prices and availability,
stores order-item price snapshots, and only then clears the cart.

## Progress Log

### Batch 10 — Full regression and final polish — 2026-07-25

- Re-ran the production release checks: 26 Vitest tests across 5 files, ESLint
  with zero warnings, TypeScript, and the 58-page/route production build pass.
- Verified signed-out, signed-in, and role-aware navigation at 8 widths from
  320px to 1920px; the account menu and all 11 footer links pass.
- Crawled 45 public catalog, marketplace, and community pages with zero console
  warnings/errors, page exceptions, or unsuccessful navigations. Guest cart
  and upload prompts, protected redirects, navbar search, and the absence of a
  `/vr` navigation are covered.
- Regressed all 5 role presentations plus credentials failures, duplicate
  signup, session persistence, expired sessions, protected redirect safety,
  strict valid-GLB upload, and owner-only upload mutation. Updated the browser
  scripts for the database-driven museum/community result shape and current
  signup/upload contracts.
- Fresh local production Lighthouse checkpoint: 76 Performance and 94
  Accessibility. Provider-hosted Google/Apple OAuth and live Stripe/Razorpay
  Card/UPI outcomes still require project-specific sandbox credentials and
  cannot be truthfully completed from the credential-free local environment;
  their validators, permissions, signatures, and service paths remain covered
  deterministically.
- The application milestone is complete locally. Deployment, production
  secrets, provider dashboards, and live-domain verification remain
  intentionally separate.

### Batch 9 — Database completeness and public community content — 2026-07-25

- Audited the database seed against all original collection and marketplace
  sources; all 4 collections, 20 unique artifacts, and 12 listings are covered.
- Removed runtime imports from `src/data`; those modules now feed only seed and
  seed-audit scripts while runtime media paths live in `src/lib/media.ts`.
- Added approved community uploads to paginated Marketplace and Collections
  queries, with clear source labels, uploader profile links, and public detail
  pages. Pending and rejected uploads remain excluded.
- Added a 40-character public-description guardrail and an accepted
  report-for-review API stub. Approval becomes public immediately from the
  existing moderation status transition.

### Batch 8 — Checkout UI, required fields, and autofill — 2026-07-25

- Added saved phone and billing-address fields to user profiles, with an
  editable account form and server-validated profile API.
- Checkout now autofills saved contact/address data, provides themed inline
  validation, accessible Card/UPI selection, live totals, and processing states.
- Stripe Payment Element supplies real-time secure card checks; Razorpay
  Checkout is UPI-focused and prefilled with saved contact details.
- The success page loads the authenticated order, polls for the signed webhook,
  and only unlocks purchased assets after server-confirmed payment.

### Batch 7 — Payment gateway foundation — 2026-07-25

- Added Stripe PaymentIntents and hosted Payment Element card entry plus
  Razorpay test-mode orders and Standard Checkout configured for UPI.
- Checkout now creates pending orders; only amount-checked, signature-verified
  Stripe and Razorpay webhooks mark them paid and clear carts.
- Added event and fulfillment idempotency, payment audit fields, test-only
  environment placeholders, and sandbox setup in `docs/PAYMENTS.md`.
- Local schema, unit, lint, type, and production-build checks are automated.
  Provider-network card/UPI checkpoints require account-specific test keys;
  providers do not publish shared secret API credentials.

### Batch 6 — Strict upload file validation — 2026-07-25

- Standardized artifact uploads on signed `.glb`, `.gltf`, and `.usdz` model
  files with a 150 MB maximum.
- Added matching client and server validation for extension, MIME type, size,
  and file signature, with rejected-file details and themed feedback.
- Ensured invalid files are rejected before storage or database creation and
  added Route Handler coverage for valid, invalid-type, and oversized files.

### Batch 5 — Themed toast and confirmation system — 2026-07-25

- Added branded success, error, warning, and information toasts using the
  museum’s cream, ink, serif, and accent styling.
- Added an accessible, reduced-motion-aware confirmation dialog for cart
  removal, upload rejection, and sign-out.
- Connected form validation, OAuth failures, role restrictions, key action
  successes, and unhandled client errors to the global themed feedback system.

### Batch 4 — Auth-gated cart, upload, and VR entry — 2026-07-25

- Removed the guest localStorage cart and now show sign-in prompts from purchase
  controls and the cart itself while keeping `/api/cart` session-protected.
- Split the upload gate into a guest sign-in state and the existing signed-in
  role restriction, with API permissions unchanged.
- Confirmed every VR CTA opens `VrEntryModal` rather than navigating to `/vr`,
  and added launch preparation and inline failure feedback.

### Batch 3 — Sitewide role-based access — 2026-07-25

- Added a single role-policy matrix, server role/permission helpers, and a
  client `useRole()` hook covering purchase, upload, selling, and moderation.
- Enforced upload, marketplace ownership mutations, cart, checkout, and orders
  in Route Handlers; role-restricted pages are also guarded by proxy and server
  checks with an explanatory access-denied state.
- Added curator-only upload approval/rejection, moderation UI, seller and
  curator indicators, role-aware upload/listing CTAs, and direct-API rejection
  tests for restricted roles.

### Batch 2 — Roles and social sign-in — 2026-07-25

- Replaced the generic user/admin role field with the canonical Artist,
  Curator, Archaeologist, Researcher, and Visitor enum and migrated existing
  users to Visitor.
- Added Google and Apple Auth.js providers, same-email account linking,
  provider-agnostic profile display, and working social-auth controls on both
  authentication forms.
- Added one-time role completion for new OAuth users, enforced it on protected
  routes, documented provider credentials in `docs/AUTH.md`, and added OAuth
  failure messaging.

### Batch 1 — Navbar cleanup and footer fixes — 2026-07-25

- Consolidated signed-in account actions into an accessible avatar menu with
  identity details, click-outside dismissal, Escape handling, and responsive
  navigation that switches to a hamburger before controls can wrap.
- Kept cart, artifact search, and VR entry available in the top-level control
  cluster from 320px through desktop widths; the VR control now opens the
  existing modal instead of linking to a missing route.
- Replaced footer placeholder links with working internal destinations and
  external social URLs, and added Privacy and Terms pages.

### v1.0 — 2026-07-25

- Completed the catalog, marketplace, authentication, persistent cart,
  checkout, uploads, asset workspace, error/loading states, motion, and
  design-fidelity passes.
- Added Vitest unit and Route Handler integration coverage, including validator
  defects found and fixed during the final regression pass.
- Added local auth/checkout throttling, currency-safe server calculations,
  AVIF/WebP image negotiation, LCP image preload, and animation-related CWV
  safeguards.
- Final automated checkpoint at that time: 14 tests, lint, TypeScript, and the
  51-route production build passed. Batch 10 supersedes these counts with a
  fresh browser and Lighthouse run.

### Pre-v1 checkpoints

- Established the Prisma schema, migrations, seed catalog, services, Route
  Handlers, Auth.js sessions, and local storage adapter.
- Wired server-backed catalog, cart, checkout, orders, uploads, and account
  pages, with authenticated smoke coverage.
- Added resilient loading/error states, accessible animations, responsive image
  sizing, metadata, search, sorting, breadcrumbs, and the final `ui.png`
  design-fidelity resolutions recorded in `docs/UI-AUDIT.md`.
# Navbar behavior

`Navbar` uses the boolean `hasHeroBackground` prop to choose its deterministic
top-of-page appearance. Pass `<Navbar hasHeroBackground />` only when the first
section is full-bleed, darkened hero media that sits behind the fixed header.
For cream, ink, form, detail, and other non-overlay page tops, use
`<Navbar hasHeroBackground={false} />` (which is also the safe default).

The previous free-form `variant` prop and runtime background-luminance sampling
were removed because they allowed page wiring and client-side pixel sampling to
disagree, causing incorrect initial contrast and visual flashes. The navbar now
uses one rule set: hero pages are transparent with white text at the top, all
other pages are solid, and every navbar becomes the same solid dark surface
after scrolling or while the mobile menu, account menu, or search panel is open.

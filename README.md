# ViswaRoop — Explore. Experience. Own History.

ViswaRoop is a multilingual virtual museum and digital-artifact marketplace built with Next.js. Visitors can explore curated collections and immersive media, authenticated members can purchase licensed artifacts, and eligible contributors can upload work for curator review.

The application lives in [`vr-museum`](vr-museum). Run all npm commands from that directory.

## What is included

- Localized public routes for 16 locales, with LTR/RTL support and persistent translation caching
- Curated collections, artifact pages, community uploads, creator profiles, and marketplace search/filtering
- Image, video, and interactive 3D presentation with `@google/model-viewer`
- Credentials, Google, and Apple authentication through Auth.js
- Five application roles with server-enforced purchase, upload, selling, and moderation permissions
- Persistent carts, Stripe card payments, Razorpay UPI payments, signed webhooks, and idempotent fulfillment
- Direct Vercel Blob uploads, local-disk development storage, and Meshy three-image-to-3D generation
- Upload moderation, artifact reports, support requests, account billing details, and order/asset history
- Zod validation, Prisma/PostgreSQL persistence, rate limiting, structured API errors, Vitest tests, and browser audit scripts

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL

Optional provider accounts are needed for OAuth, payments, Vercel Blob, Gemini translation, and Meshy generation.

## Local setup

```powershell
cd vr-museum
npm install
Copy-Item .env.example .env
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`. The proxy redirects unprefixed pages to the selected locale, such as `/en`.

At minimum, replace `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_SECRET` in `.env`. The two auth secrets should contain the same strong random value. Features whose provider credentials are absent remain unavailable or use their documented fallback.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and create a production build |
| `npm start` | Run the production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting files |
| `npm run prisma:seed` | Seed the catalog explicitly |
| `npm run seed:audit` | Compare seed inputs for completeness |
| `npm run prisma:studio` | Open Prisma Studio |

Verified on 2026-08-09: 53 tests across 9 files, ESLint, and TypeScript all pass.

## Architecture

```text
Next.js pages and React components
              ↓
App Router Route Handlers
              ↓
Domain services and Zod validators
              ↓
Prisma Client + PostgreSQL
              ↓
Optional external providers and object storage
```

- `src/app` contains localized pages, boundaries, and HTTP Route Handlers.
- `src/components` contains UI, layouts, media viewers, checkout, moderation, and providers.
- `src/server/services` owns business rules and provider coordination.
- `src/lib/validators` defines shared request contracts.
- `src/server/storage` selects Vercel Blob or local-disk upload storage.
- `prisma` contains the PostgreSQL schema and migration history.
- `scripts` contains smoke, browser, role, navigation, media, and seed audits.

## Documentation

- [API reference](vr-museum/docs/API.md)
- [Authentication](vr-museum/docs/AUTH.md)
- [Backend architecture](vr-museum/docs/BACKEND.md)
- [Deployment](vr-museum/docs/DEPLOYMENT.md)
- [Payments](vr-museum/docs/PAYMENTS.md)
- [Roles and permissions](vr-museum/docs/ROLES.md)
- [Testing](vr-museum/docs/TESTING.md)
- [Translations](vr-museum/docs/TRANSLATIONS.md)
- [Release QA](vr-museum/docs/FINAL_QA.md)
- [UI audit](vr-museum/docs/UI-AUDIT.md)
- [Multilingual coverage audit](vr-museum/docs/MULTILINGUAL_COVERAGE_AUDIT.md)

## Important production notes

- `npm run vercel-build` deploys migrations but does **not** seed data. Seed a new production database explicitly with `npm run prisma:seed` from a trusted environment.
- Payment fulfillment occurs only after a verified provider webhook; a browser success screen is not authoritative.
- The built-in rate limiter is process-local. Replace it with a shared store before horizontally scaling production traffic.
- Meshy generation requires both `MESHY_API_KEY` and a public Vercel Blob store.
- Uploaded models are limited to 150 MB; videos are limited to 200 MB. Accepted model formats are GLB, glTF, OBJ, and STL; accepted video formats are MP4, MOV, and WebM.
- Never expose server secrets with a `NEXT_PUBLIC_` prefix.

# Backend architecture

Last verified against the source on 2026-08-09.

The backend is part of the Next.js application. App Router Route Handlers provide the HTTP API; there is no separate API server.

## Request flow

```text
src/app/api/**/route.ts
        ↓
Zod request validation
        ↓
src/server/services/*.service.ts
        ↓
src/lib/prisma.ts
        ↓
Prisma Client → PostgreSQL
```

- Routes authenticate, validate input, call services, and map failures to the standard API envelope.
- Services own catalog, cart, checkout, payment, upload, moderation, translation, support, and user rules.
- `src/lib/prisma.ts` exposes the shared Prisma client. Do not create route-local clients.
- `src/lib/validators` contains reusable Zod contracts.
- `src/lib/api-response.ts`, `route-error.ts`, and `service-error.ts` standardize responses and errors.
- `src/lib/logger.ts` provides server-side structured logging.

## Persistence

All environments use PostgreSQL through Prisma's `@prisma/adapter-pg` adapter. The active schema and migrations are under `prisma/`. Runtime data includes users and Auth.js accounts, collections, artifacts, listings, carts, orders, payment events, uploaded assets, reports, support requests, translation cache rows, and Meshy source-upload cleanup records.

Use a pooled, TLS-enabled production connection string in `DATABASE_URL`. Apply checked-in migrations with:

```bash
npx prisma migrate deploy
```

Catalog seeding is a separate, explicit operation:

```bash
npm run prisma:seed
```

## Authentication and authorization

Auth.js is configured in `src/lib/auth.ts` with credentials, Google, and Apple providers and JWT sessions. `requireUserId`, `getCurrentUser`, and `requirePermission` are the server authorization helpers. In development only, selected API flows accept `x-user-id` for scripted testing; production requires a real Auth.js session.

Application permissions are centralized in `src/lib/role-policy.ts`. UI visibility is only presentation—the service/API boundary remains authoritative. See [ROLES.md](ROLES.md).

## Storage and uploads

`src/server/storage` selects Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured and otherwise uses local disk under `public/uploads`. With `NEXT_PUBLIC_BLOB_UPLOADS=true`, the browser uses a signed direct-upload flow so large media does not pass through the application server request body.

Set `STORAGE_PROVIDER=backblaze-b2` and
`NEXT_PUBLIC_STORAGE_PROVIDER=backblaze-b2` with the five `B2_*` variables to
use a private Backblaze B2 bucket. Browser uploads use short-lived
presigned PUT URLs; configure bucket CORS to allow `PUT` from the production and
preview origins with the `Content-Type` header. Stable `/api/media/*` URLs issue
short-lived signed download redirects, so the bucket does not need public access.
Existing Vercel Blob URLs remain
readable during migration. `npm run storage:migrate-b2` previews referenced
objects and `npm run storage:migrate-b2 -- --apply` copies each object, updates
database references transactionally, and deletes its old Blob only afterward.

Uploads support:

- Models: GLB, glTF, OBJ, or STL, up to 150 MB
- Videos: MP4, MOV, or WebM, up to 150 MB
- A required display image for uploaded media

File extensions, MIME types, sizes, and supported signatures are checked before persistence. Contributor updates are owner-scoped. Curators can approve, reject, or request changes; approved uploads become public community content.

Meshy generation requires exactly three JPG/PNG source views, `MESHY_API_KEY`, and publicly readable object-storage URLs. Source image URLs are recorded by task ID and removed on terminal task states on a best-effort basis.
New Meshy jobs request only GLB output, a 2K base-color texture without extra
PBR maps, and Meshy's low adaptive remesh tier to keep web-delivery models
materially smaller than the original generation defaults.

Owner deletion, curator removal, and media replacement remove superseded Blob
objects after the database mutation succeeds. A daily authenticated cron sweep
deletes direct-upload objects that remain unreferenced for 24 hours and rejected
uploads after 30 days. Operators can preview the identical sweep locally with
`npm run uploads:cleanup`; it never deletes unless re-run as
`npm run uploads:cleanup -- --apply`.

## Checkout and payment lifecycle

Checkout creates a pending order from server-loaded cart prices. Stripe and Razorpay integrations create provider payment objects, but only signed, amount-checked webhooks mark an order paid and clear its cart. Provider event IDs and conditional updates make repeated/concurrent webhook delivery idempotent.

## Translation architecture

Localized URLs and cookies are handled by `src/proxy.ts` and `src/lib/i18n.ts`. UI phrases are translated server-side through Gemini and cached in PostgreSQL `TranslationCache` rows. Artifact, collection, and upload translations live in their records' `translations` JSON. Provider or cache failure falls back to English rather than failing a page.

## Operational limitations

- Rate limiting in `src/lib/rate-limit.ts` is process-local and unsuitable for multi-instance enforcement.
- Local-disk uploads are a development fallback, not durable serverless storage.
- Payment, OAuth, translation, Blob, and Meshy end-to-end checks require project-specific credentials.

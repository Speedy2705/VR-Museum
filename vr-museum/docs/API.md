# API reference

Last verified against `src/app/api` on 2026-08-09.

Application endpoints use Next.js Route Handlers. Successful and failed application responses use these envelopes:

```json
{ "success": true, "data": {}, "message": "Optional message" }
```

```json
{ "success": false, "error": { "message": "Readable message", "code": "MACHINE_CODE", "details": {} } }
```

Auth.js endpoints under `/api/auth/*` use Auth.js response formats. Prisma decimals serialize as strings. Zod validation failures return structured error details.

## Authentication

Protected endpoints require an Auth.js session and, where noted, an application permission. In non-production environments only, internal browser scripts and REST checks may use `x-user-id`; this fallback is disabled in production.

The rate limiter is process-local. Current one-minute limits include 5 registration attempts, 20 Auth.js POST requests, 5 checkout attempts, and 5 translation requests per client identity.

## Public catalog

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Database/application health status |
| `GET` | `/api/collections` | All collections with artifact counts |
| `GET` | `/api/collections/:slug` | One collection and its artifacts |
| `GET` | `/api/artifacts` | Artifact list; accepts validated `collection`, `preset`, and search query filters |
| `GET` | `/api/artifacts/:slug` | One artifact with collection and active listing data |
| `GET` | `/api/marketplace` | Paginated active official and approved-community marketplace items |
| `GET` | `/api/marketplace/:slug` | One active marketplace item |
| `POST` | `/api/uploads/:id/view` | Increment an approved community upload's view count |

Marketplace pagination accepts `page` (default `1`), `limit` (`1`–`100`, default `12`), and `search` (maximum 200 characters). Responses include `items` and `{ page, limit, total, pages }` pagination metadata.

## Registration and profile

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js | Provider/session actions |
| `POST` | `/api/auth/register` | Public, rate-limited | Create a credentials user |
| `GET` | `/api/profile` | Signed in | Read saved billing/contact details |
| `PUT` | `/api/profile` | Signed in | Replace validated billing/contact details |
| `PATCH` | `/api/profile` | Signed in | Complete the role profile |
| `PUT` | `/api/profile/language` | Signed in | Persist `{ "locale": "..." }` |

OAuth-created users without a role are redirected to profile completion before role-protected flows.

## Marketplace ownership

`PATCH /api/marketplace/:slug` and `DELETE /api/marketplace/:slug` require the `sell` permission and listing ownership. Patch accepts validated price, three-letter currency, and/or status fields. Non-owners receive a not-found response so ownership is not disclosed.

## Cart and orders

All cart/order methods require the corresponding purchase or order-view permission.

| Method | Path | Body/description |
| --- | --- | --- |
| `GET` | `/api/cart` | Current cart with listing/artifact/seller data |
| `POST` | `/api/cart` | `{ "listingId": "...", "quantity": 1 }`; add or increment |
| `PATCH` | `/api/cart` | `{ "itemId": "...", "quantity": 2 }`; set quantity |
| `DELETE` | `/api/cart` | `{ "itemId": "..." }`; remove owned cart item |
| `GET` | `/api/orders` | Current user's orders |
| `GET` | `/api/orders/:id` | One current-user-owned order |

## Checkout and payments

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/checkout` | Create a pending order from authoritative cart prices; body contains validated `paymentMethod` (`CARD` or `UPI`) |
| `POST` | `/api/payments/card/intent` | Create a Stripe PaymentIntent for the current cart/order |
| `POST` | `/api/payments/upi/order` | Create a Razorpay UPI order |
| `POST` | `/api/payments/webhook` | Stripe webhook; verifies the raw-body signature and payment facts |
| `POST` | `/api/payments/razorpay-webhook` | Razorpay webhook; verifies signature and captured payment facts |

A client-reported success never marks an order paid. Only a verified webhook performs idempotent fulfillment and cart clearing. See [PAYMENTS.md](PAYMENTS.md).

## Uploads and Blob

Upload routes require the `upload` permission (Artist, Archaeologist, or Curator).

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/blob-upload` | Issue/handle a signed direct Vercel Blob upload token |
| `POST` | `/api/upload` | Create a multipart upload or register validated stored Blob URLs |
| `GET` | `/api/upload/:id` | Read an owned upload |
| `PATCH` | `/api/upload/:id` | Update/resubmit an eligible owned upload; multipart supported |
| `DELETE` | `/api/upload/:id` | Delete an owned upload |

Models accept GLB, glTF, OBJ, or STL up to 150 MB. Videos accept MP4, MOV, or WebM up to 200 MB. A display image is required. Rejected uploads are terminal; `CHANGES_REQUESTED` uploads may be edited and resubmitted.

## Meshy generation

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/meshy/multi-image` | Submit exactly front/side/back JPG or PNG files; returns `202` |
| `GET` | `/api/meshy/multi-image/:id` | Poll a task owned by the authorized flow |
| `GET` | `/api/meshy/multi-image/:id/download` | Download ready GLB output |

These routes require upload permission, `MESHY_API_KEY`, and public Vercel Blob storage.

## Translation

`POST /api/translations` accepts a supported locale and a bounded phrase batch. It returns cached translations first, calls Gemini only for misses, and persists successful results in PostgreSQL. The API key never reaches the browser. See [TRANSLATIONS.md](TRANSLATIONS.md).

## Reports, support, and moderation

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/reports` | Signed in | Report an official/community artifact |
| `POST` | `/api/support` | Signed in | Create a query or feedback request |
| `PATCH` | `/api/moderation/uploads/:id` | Curator | Approve, reject, or request changes |
| `PATCH` | `/api/moderation/reports/:id` | Curator | Dismiss a report or remove content |
| `PATCH` | `/api/moderation/support/:id` | Curator | Answer a support request |

## Error semantics

Common statuses are `400` for validation/business-rule failures, `401` for missing authentication, `403` for insufficient role permission, `404` for missing or deliberately undisclosed owner-scoped resources, `409` for conflicts, `429` for rate limits, and `500` for unexpected/infrastructure failures.

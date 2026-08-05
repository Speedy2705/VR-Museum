# API Reference

The API is implemented with Next.js Route Handlers under `src/app/api`. Domain
logic lives in `src/server/services`, and all application endpoints return one
of these envelopes:

```json
{ "success": true, "data": {}, "message": "Optional message" }
```

```json
{
  "success": false,
  "error": {
    "message": "Human-readable message",
    "code": "MACHINE_CODE",
    "details": {}
  }
}
```

Auth.js-owned endpoints under `/api/auth/*` use Auth.js response formats.
Prisma `Decimal` values are serialized as JSON strings.

## Authentication

Cart, checkout, order, and upload endpoints require an Auth.js session. During
local development only, REST clients may send `x-user-id: <user id>` to test
these endpoints without first establishing an Auth.js cookie session. This
fallback is disabled when `NODE_ENV=production`.

The intentionally process-local rate limiter allows 5 registration attempts,
20 Auth.js POST actions, and 5 checkout attempts per IP per minute. It is
suitable for local/single-process development only; use a shared store before
running multiple production instances.

## Collections

### `GET /api/collections`

Returns all collections with an artifact count. No payload.

### `GET /api/collections/:slug`

Returns one collection and its artifacts.

## Artifacts

### `GET /api/artifacts`

Returns artifacts with their collection. Optional query parameters:

| Parameter | Shape | Description |
| --- | --- | --- |
| `collection` | string | Exact collection slug |
| `preset` | string | Exact lighting preset |

Example: `/api/artifacts?collection=earth-fire&preset=Warm%20Diffuse`.

### `GET /api/artifacts/:slug`

Returns an artifact, collection, and active listings.

## Marketplace

### `GET /api/marketplace`

Returns active listings and pagination metadata.

| Parameter | Shape | Default | Description |
| --- | --- | --- | --- |
| `page` | positive integer | `1` | Page number |
| `limit` | integer, 1–100 | `12` | Items per page |
| `search` | string, max 200 | — | Searches artifact title/description and seller name |

Response data shape:

```json
{
  "items": [],
  "pagination": { "page": 1, "limit": 12, "total": 12, "pages": 1 }
}
```

### `GET /api/marketplace/:slug`

Returns the active listing whose artifact has the supplied slug.

### `PATCH|DELETE /api/marketplace/:slug`

Requires authentication and ownership of the listing. `PATCH` accepts one or
more of `price`, three-letter `currency`, or `status`. Non-owners receive `404`
so ownership is not disclosed.

## Cart

All cart methods require authentication.

### `GET /api/cart`

Returns the current user's cart items with listing, artifact, and seller data.

### `POST /api/cart`

Adds a listing or increments its existing quantity.

```json
{ "listingId": "listing-id", "quantity": 1 }
```

`quantity` defaults to `1`. Returns `201`.

### `PATCH /api/cart`

Sets a cart item's quantity.

```json
{ "itemId": "cart-item-id", "quantity": 2 }
```

### `DELETE /api/cart`

Removes a cart item owned by the current user.

```json
{ "itemId": "cart-item-id" }
```

## Checkout

### `POST /api/checkout`

Requires authentication and an empty JSON object:

```json
{}
```

Inside one database transaction, checkout reloads the cart, verifies each
listing is active and its artifact remains for sale, calculates the current
total, stores each listing price in an `OrderItem`, creates a paid order, and
clears the cart. Returns the order with `201`.

## Orders

All order endpoints require authentication and only return orders owned by the
current user.

### `GET /api/orders`

Returns order history, newest first, including purchased listing and artifact
data.

### `GET /api/orders/:id`

Returns one owned order and its items.

## Uploads

All upload endpoints require authentication.

### `POST /api/upload`

Creates an uploaded asset with `PENDING` status. The endpoint stores submission
metadata. The Upload wizard sends `multipart/form-data` with a `file` plus
`title`, `category`, `type`, `origin`, `collection`, `lighting`, `price`, and
`license` fields. In development, the file is written under `public/uploads`
through the `FileStorage` interface; an S3 or Cloudinary adapter can replace
the local binding without changing the route.

JSON submissions remain supported for trusted callers:

```json
{
  "title": "Ceremonial Vessel",
  "category": "Ceramic",
  "fileUrl": "/uploads/ceremonial-vessel.glb",
  "thumbnailUrl": "/uploads/ceremonial-vessel.png",
  "metadata": {
    "period": "5th century BCE",
    "license": "CC-BY 4.0"
  }
}
```

`thumbnailUrl` is nullable/optional and `metadata` defaults to `{}`. Returns
`201`.

### `GET /api/upload/:id`

Returns the current user's upload and moderation status.

### `PATCH|DELETE /api/upload/:id`

Requires authentication and ownership of the upload. `PATCH` accepts `title`,
`category`, `thumbnailUrl`, or `metadata`.

## Registration and Auth.js

### `POST /api/auth/register`

Creates a credentials user and hashes the password with bcrypt.

```json
{
  "name": "Ada Curator",
  "phone": "+919876543210",
  "role": "CURATOR",
  "password": "at-least-8-characters"
}
```

Names are 1–120 characters and passwords are 8–128 characters. At least one
of `email` or `phone` is required; both are accepted and each must be unique.
Phones use E.164 form with a leading `+` and international country code.
Returns the public user fields with `201`.

### `GET|POST /api/auth/[...nextauth]`

Auth.js catch-all handler using the Prisma adapter and JWT sessions. It exposes
the standard Auth.js endpoints, including:

- `GET /api/auth/session`
- `GET /api/auth/providers`
- `GET /api/auth/csrf`
- `POST /api/auth/callback/credentials`
- `POST /api/auth/signout`

Credentials sign-in accepts the registered email or canonical international
mobile number (for example, `+919876543210`) and password. Auth.js manages
the exact request and response shapes for these endpoints.

## Common status codes

| Status | Meaning |
| --- | --- |
| `200` | Successful read/update/delete |
| `201` | Resource created or checkout completed |
| `400` | Invalid JSON or Zod validation failure |
| `401` | Authentication required |
| `404` | Resource absent or not owned by the current user |
| `409` | Duplicate email, empty cart, or unavailable listing |
| `429` | Auth or checkout rate limit rejected the request |
| `500` | Unexpected server failure |

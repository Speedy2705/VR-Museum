# Production deployment

The supported production target is Vercel with Prisma Postgres and Vercel
Blob. Import the GitHub repository into Vercel and set the project root to
`vr-museum`.

## Required Vercel integrations

Create and connect these resources from the project's Storage tab:

1. Prisma Postgres, which supplies `DATABASE_URL`.
2. Vercel Blob, which supplies `BLOB_READ_WRITE_TOKEN`.

Add these variables to Production and Preview:

```text
AUTH_SECRET=<one cryptographically random 32-byte-or-longer value>
NEXTAUTH_SECRET=<the same value, retained for compatibility>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_BLOB_UPLOADS=true
MESHY_API_KEY=<server-only key from https://www.meshy.ai/settings/api>
GEMINI_API_KEY=<server-only key from https://aistudio.google.com/app/apikey>
GEMINI_TRANSLATION_MODEL=gemini-3.5-flash-lite
```

Set `AUTH_URL` only after the production hostname is known:

```text
AUTH_URL=https://your-project.vercel.app
```

Never copy `.env` into Git. Meshy requires the connected public Blob store
because its Multi-Image endpoint consumes public JPG/PNG URLs. Payment and
OAuth variables from `.env.example` are optional until those providers are
enabled.

## Build and database

Vercel uses `npm run vercel-build`, which generates Prisma Client, applies the
checked-in PostgreSQL migrations, idempotently seeds the catalog, and builds
Next.js. Seeding runs before page generation so a new database can deploy
without copying its sensitive connection string to a developer machine.

## Provider callbacks

If Google sign-in is enabled, register:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

If Apple sign-in is enabled, register:

```text
https://YOUR_DOMAIN/api/auth/callback/apple
```

Stripe's webhook endpoint is:

```text
https://YOUR_DOMAIN/api/payments/webhook
```

Razorpay's webhook endpoint is:

```text
https://YOUR_DOMAIN/api/payments/razorpay-webhook
```

Use test-mode payment keys until the complete checkout flow has been verified.

## Release verification

After deployment, test sign-up/sign-in, catalog pages, an authorized upload,
moderation, cart and checkout. Then add a custom domain under Settings >
Domains, update `AUTH_URL`, OAuth callbacks, and payment webhooks to that
domain, and redeploy.

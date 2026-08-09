# Production deployment

Last verified against `package.json`, `.env.example`, and `vercel.json` on 2026-08-09.

The intended production target is Vercel with PostgreSQL and Vercel Blob. Set the Vercel project root to `vr-museum`.

## Required infrastructure

1. A PostgreSQL database exposed through `DATABASE_URL`.
2. A Vercel Blob store supplying `BLOB_READ_WRITE_TOKEN`.
3. A strong Auth.js secret supplied as both `AUTH_SECRET` and `NEXTAUTH_SECRET`.

Recommended base variables:

```dotenv
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
NEXTAUTH_SECRET="..."
AUTH_URL="https://your-domain.example"
AUTH_TRUST_HOST="true"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NEXT_PUBLIC_BLOB_UPLOADS="true"
```

Enable `AUTH_TRUST_HOST` only on a trusted managed host or behind a correctly configured reverse proxy. Never commit `.env` files.

## Optional providers

Add the relevant variables from `.env.example` for the features you enable:

- Google: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Apple: `AUTH_APPLE_ID`, `AUTH_APPLE_SECRET`
- Stripe: publishable key, secret key, and webhook secret
- Razorpay: key ID, key secret, webhook secret, and the sandbox USD-to-INR rate
- Gemini: `GEMINI_API_KEY`, optionally `GEMINI_TRANSLATION_MODEL`
- Meshy: `MESHY_API_KEY` (also requires Vercel Blob)

All provider secret keys are server-only. Only variables intentionally named `NEXT_PUBLIC_*` are exposed to the browser.

## Build and migrations

Vercel runs:

```bash
npm run vercel-build
```

That command generates Prisma Client, runs `prisma migrate deploy`, and builds Next.js. It does **not** seed the database. For a new environment, run the seed explicitly from a trusted machine or one-off deployment job after migrations:

```bash
npm run prisma:seed
```

The seed is intended to populate the initial catalog; do not silently add it to every production build without first confirming its idempotency and desired release policy.

## Provider callbacks

Register exact HTTPS URLs for the deployed origin:

```text
https://YOUR_DOMAIN/api/auth/callback/google
https://YOUR_DOMAIN/api/auth/callback/apple
https://YOUR_DOMAIN/api/payments/webhook
https://YOUR_DOMAIN/api/payments/razorpay-webhook
```

Use test-mode payment credentials until signed webhook fulfillment has been verified on the deployed domain.

## Release checklist

1. Confirm all secrets are set for Production and, if needed, Preview.
2. Deploy migrations and explicitly seed a new database.
3. Check `/api/health` and core localized catalog pages.
4. Test credentials login, enabled OAuth providers, and profile completion.
5. Test an authorized upload, Blob delivery, moderation, and public community visibility.
6. Test Stripe and Razorpay success/failure paths and webhook replay idempotency.
7. Verify translation caching and Arabic/Urdu RTL layouts.
8. Run the commands and browser checks in [TESTING.md](TESTING.md).
9. After attaching a custom domain, update `AUTH_URL`, OAuth callbacks, and payment webhooks, then redeploy.

## Production hardening

- Replace the in-memory rate limiter with a shared store before scaling beyond one process.
- Use a managed pooled database connection suitable for serverless workloads.
- Treat local-disk uploads as development-only.
- Replace the fixed Razorpay sandbox FX rate with an explicit production currency policy.
- Configure monitoring for failed webhooks, Blob failures, translation-provider failures, and database migration errors.

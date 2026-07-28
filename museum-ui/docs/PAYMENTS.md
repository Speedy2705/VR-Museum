# Payments: Stripe cards and Razorpay UPI

This integration is test-mode only. The server creates a pending order from
authoritative cart prices and fulfills it only after a signed provider webhook.
Browser-reported success never marks an order paid.

## Environment

Copy payment variables from `.env.example` into an untracked `.env`. Generate
your own test keys in Stripe Dashboard (Developers → API keys) and Razorpay
Dashboard (Test Mode → Account & Settings → API Keys). Neither provider
publishes a shared secret test API key: test payment details are public, but
secret API keys are account-specific.

```dotenv
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_USD_TO_INR_RATE=83
```

The catalog stores USD. Stripe charges USD. Razorpay UPI charges INR, so the
server converts using the configured sandbox rate and validates that amount in
the webhook. Replace this fixed test conversion with a production FX policy.

## Stripe card sandbox

1. Forward events with `stripe listen --forward-to
   localhost:3000/api/payments/webhook`; put its `whsec_...` in `.env`.
2. Choose Card at checkout. Use `4242 4242 4242 4242`, any future expiry and
   any CVC for success; use `4000 0000 0000 0002` for a decline.
3. Confirm `Order.paymentStatus` and `Order.status` become `PAID`, the intent ID
   is stored, and the cart is cleared.

Official test details: https://docs.stripe.com/testing

## Razorpay UPI sandbox

1. Configure a Test Mode webhook ending in
   `/api/payments/razorpay-webhook`, select `payment.captured`, and set the
   separate secret used by `RAZORPAY_WEBHOOK_SECRET`.
2. Choose UPI at checkout. Use `success@razorpay` for success or
   `failure@razorpay` for failure.
3. Confirm the captured webhook marks the order paid, stores the payment ID,
   and clears the cart.

Official test flow:
https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

## Direct API checks

```bash
curl -X POST http://localhost:3000/api/payments/card/intent -H "x-user-id: USER_ID"
curl -X POST http://localhost:3000/api/payments/upi/order -H "x-user-id: USER_ID"
```

These calls require your account-specific test keys. Use Stripe CLI to
create/forward a successful event. Complete the Razorpay order through Test
Checkout with `success@razorpay`. Re-send either signed event to verify it is
accepted without fulfilling twice.

Webhooks verify signatures over the untouched body, validate provider
reference, amount, currency and successful state, record provider event IDs,
and use a conditional database update for concurrent-delivery idempotency.

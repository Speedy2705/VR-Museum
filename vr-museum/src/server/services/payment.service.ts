import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import {
  createPendingOrder,
  finalizePaidOrder,
} from "@/server/services/checkout.service";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new ServiceError(
      `${name} is not configured`,
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      503,
    );
  }
  return value;
}

function stripeClient() {
  return new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
}

function razorpayClient() {
  return new Razorpay({
    key_id: requiredEnv("RAZORPAY_KEY_ID"),
    key_secret: requiredEnv("RAZORPAY_KEY_SECRET"),
  });
}

export async function createCardIntent(userId: string) {
  const order = await createPendingOrder(userId, "CARD");
  const amount = Math.round(Number(order.total) * 100);
  const intent = await stripeClient().paymentIntents.create(
    {
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, userId },
    },
    { idempotencyKey: `order:${order.id}:card` },
  );
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentProviderRef: intent.id },
  });
  return { orderId: order.id, clientSecret: intent.client_secret };
}

export async function createUpiOrder(userId: string) {
  const order = await createPendingOrder(userId, "UPI");
  const rate = Number(requiredEnv("RAZORPAY_USD_TO_INR_RATE"));
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new ServiceError(
      "RAZORPAY_USD_TO_INR_RATE must be a positive number",
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      503,
    );
  }
  const amount = Math.round(Number(order.total) * rate * 100);
  const providerOrder = await razorpayClient().orders.create({
    amount,
    currency: "INR",
    receipt: order.id.slice(0, 40),
    notes: { orderId: order.id, userId },
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentProviderRef: providerOrder.id },
  });
  return {
    orderId: order.id,
    keyId: requiredEnv("RAZORPAY_KEY_ID"),
    providerOrderId: providerOrder.id,
    amount: providerOrder.amount,
    currency: providerOrder.currency,
  };
}

async function recordWebhookEvent(id: string, provider: string) {
  const existing = await prisma.paymentWebhookEvent.findUnique({ where: { id } });
  if (existing) return false;
  await prisma.paymentWebhookEvent.create({ data: { id, provider } });
  return true;
}

export async function handleStripeWebhook(rawBody: string, signature: string) {
  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      requiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    throw new ServiceError("Invalid Stripe webhook signature", "INVALID_SIGNATURE", 400);
  }
  const webhookId = `stripe:${event.id}`;
  if (await prisma.paymentWebhookEvent.findUnique({ where: { id: webhookId } })) {
    return { duplicate: true };
  }
  if (event.type !== "payment_intent.succeeded") {
    await recordWebhookEvent(webhookId, "stripe");
    return { ignored: true };
  }

  const intent = event.data.object;
  const order = await prisma.order.findFirst({
    where: { id: intent.metadata.orderId, paymentProviderRef: intent.id },
  });
  if (
    !order ||
    order.paymentMethod !== "CARD" ||
    intent.currency !== "usd" ||
    intent.amount_received !== Math.round(Number(order.total) * 100)
  ) {
    throw new ServiceError("Stripe payment does not match an order", "PAYMENT_MISMATCH", 400);
  }
  const result = await finalizePaidOrder(order.id, intent.id);
  await recordWebhookEvent(webhookId, "stripe");
  return result;
}

export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string,
  eventId: string,
) {
  const expected = createHmac("sha256", requiredEnv("RAZORPAY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    throw new ServiceError("Invalid Razorpay webhook signature", "INVALID_SIGNATURE", 400);
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new ServiceError("Invalid Razorpay webhook signature", "INVALID_SIGNATURE", 400);
  }
  const webhookId = `razorpay:${eventId}`;
  if (await prisma.paymentWebhookEvent.findUnique({ where: { id: webhookId } })) {
    return { duplicate: true };
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    payload?: { payment?: { entity?: {
      id?: string; order_id?: string; amount?: number; currency?: string; status?: string;
    } } };
  };
  if (event.event !== "payment.captured") {
    await recordWebhookEvent(webhookId, "razorpay");
    return { ignored: true };
  }
  const payment = event.payload?.payment?.entity;
  const order = await prisma.order.findFirst({
    where: { paymentProviderRef: payment?.order_id },
  });
  const rate = Number(requiredEnv("RAZORPAY_USD_TO_INR_RATE"));
  if (
    !order ||
    order.paymentMethod !== "UPI" ||
    payment?.status !== "captured" ||
    payment.currency !== "INR" ||
    payment.amount !== Math.round(Number(order.total) * rate * 100) ||
    !payment.id
  ) {
    throw new ServiceError("Razorpay payment does not match an order", "PAYMENT_MISMATCH", 400);
  }
  const result = await finalizePaidOrder(order.id, payment.id);
  await recordWebhookEvent(webhookId, "razorpay");
  return result;
}

import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { handleStripeWebhook } from "@/server/services/payment.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return apiError("Missing Stripe signature", { status: 400 });
    return apiSuccess(await handleStripeWebhook(await request.text(), signature));
  } catch (error) {
    return handleRouteError(error, "POST /api/payments/webhook");
  }
}

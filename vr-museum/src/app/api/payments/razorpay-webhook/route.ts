import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { handleRazorpayWebhook } from "@/server/services/payment.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    const eventId = request.headers.get("x-razorpay-event-id");
    if (!signature || !eventId) {
      return apiError("Missing Razorpay webhook headers", { status: 400 });
    }
    return apiSuccess(
      await handleRazorpayWebhook(await request.text(), signature, eventId),
    );
  } catch (error) {
    return handleRouteError(error, "POST /api/payments/razorpay-webhook");
  }
}

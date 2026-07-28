import { apiError, apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { checkRateLimit, getRequestIdentity } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { checkoutSchema } from "@/lib/validators/order";
import { createPendingOrder } from "@/server/services/checkout.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`checkout:${getRequestIdentity(request)}`, {
      limit: 5,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return apiError("Too many checkout attempts", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }
    const { paymentMethod } = checkoutSchema.parse(await request.json());
    return apiSuccess(await createPendingOrder(
      (await requirePermission(request, "purchase")).id,
      paymentMethod === "card" ? "CARD" : "UPI",
    ), {
      message: "Pending order created",
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error, "POST /api/checkout");
  }
}

import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { createCardIntent } from "@/server/services/payment.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requirePermission(request, "purchase");
    return apiSuccess(await createCardIntent(user.id), { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/payments/card/intent");
  }
}

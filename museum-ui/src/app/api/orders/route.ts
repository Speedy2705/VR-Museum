import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { listOrders } from "@/server/services/order.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return apiSuccess(
      await listOrders((await requirePermission(request, "viewOrders")).id),
    );
  } catch (error) {
    return handleRouteError(error, "GET /api/orders");
  }
}

import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { orderIdSchema } from "@/lib/validators/order";
import { getOrder } from "@/server/services/order.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = orderIdSchema.parse(await params);
    return apiSuccess(
      await getOrder((await requirePermission(request, "viewOrders")).id, id),
    );
  } catch (error) {
    return handleRouteError(error, "GET /api/orders/[id]");
  }
}

import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { getMultiImageTask } from "@/server/services/tripo.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(request, "upload");
    const { id } = await params;
    const task = await getMultiImageTask(id);
    return apiSuccess({
      status: task.status,
      progress: typeof task.progress === "number" ? task.progress : 0,
      error: typeof task.message === "string" ? task.message : null,
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/tripo/multi-image/[id]");
  }
}

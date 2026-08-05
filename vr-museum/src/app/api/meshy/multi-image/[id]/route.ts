import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { getMultiImageTask } from "@/server/services/meshy.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(request, "upload");
    const { id } = await params;
    const task = await getMultiImageTask(id);
    const taskError = task.task_error as Record<string, unknown> | undefined;
    return apiSuccess({
      status: task.status,
      progress: typeof task.progress === "number" ? task.progress : 0,
      error: typeof taskError?.message === "string" ? taskError.message : null,
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/meshy/multi-image/[id]");
  }
}

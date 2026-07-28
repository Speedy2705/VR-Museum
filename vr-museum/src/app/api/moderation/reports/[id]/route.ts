import { z } from "zod";
import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { resolveArtifactReport } from "@/server/services/report.service";

const actionSchema = z.object({ action: z.enum(["DISMISS", "REMOVE"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const curator = await requirePermission(request, "moderateUploads");
    const { id } = await params;
    const { action } = actionSchema.parse(await request.json());
    return apiSuccess(await resolveArtifactReport(id, curator.id, action));
  } catch (error) {
    return handleRouteError(error, "PATCH /api/moderation/reports/[id]");
  }
}

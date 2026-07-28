import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { moderationSchema, uploadIdSchema } from "@/lib/validators/upload";
import { moderateUpload } from "@/server/services/upload.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const curator = await requirePermission(request, "moderateUploads");
    const { id } = uploadIdSchema.parse(await params);
    const { status, comment } = moderationSchema.parse(await request.json());
    return apiSuccess(await moderateUpload(id, status, comment, curator.id), {
      message: status === "APPROVED"
        ? "Upload approved"
        : status === "CHANGES_REQUESTED"
          ? "Changes requested"
          : "Upload rejected",
    });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/moderation/uploads/[id]");
  }
}

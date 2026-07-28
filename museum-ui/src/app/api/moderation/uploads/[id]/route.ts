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
    await requirePermission(request, "moderateUploads");
    const { id } = uploadIdSchema.parse(await params);
    const { status } = moderationSchema.parse(await request.json());
    return apiSuccess(await moderateUpload(id, status), {
      message: status === "APPROVED" ? "Upload approved" : "Upload rejected",
    });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/moderation/uploads/[id]");
  }
}

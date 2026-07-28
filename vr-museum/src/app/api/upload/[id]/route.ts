import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { uploadIdSchema, uploadUpdateSchema } from "@/lib/validators/upload";
import {
  deleteUpload,
  getUpload,
  updateUpload,
} from "@/server/services/upload.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = uploadIdSchema.parse(await params);
    const user = await requirePermission(request, "upload");
    return apiSuccess(await getUpload(user.id, id));
  } catch (error) {
    return handleRouteError(error, "GET /api/upload/[id]");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = uploadIdSchema.parse(await params);
    const input = uploadUpdateSchema.parse(await request.json());
    return apiSuccess(
      await updateUpload((await requirePermission(request, "upload")).id, id, input),
    );
  } catch (error) {
    return handleRouteError(error, "PATCH /api/upload/[id]");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = uploadIdSchema.parse(await params);
    return apiSuccess(
      await deleteUpload((await requirePermission(request, "upload")).id, id),
    );
  } catch (error) {
    return handleRouteError(error, "DELETE /api/upload/[id]");
  }
}

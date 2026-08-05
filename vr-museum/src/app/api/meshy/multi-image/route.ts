import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { ServiceError } from "@/lib/service-error";
import { createMultiImageTask } from "@/server/services/meshy.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePermission(request, "upload");
    const form = await request.formData();
    const images = ["front", "side", "back"].map((key) => form.get(key));
    if (images.some((image) => !(image instanceof File))) {
      throw new ServiceError("Front, side, and back images are required", "SOURCE_IMAGES_REQUIRED", 400);
    }
    return apiSuccess(await createMultiImageTask(images as File[]), { status: 202, message: "3D generation started" });
  } catch (error) {
    return handleRouteError(error, "POST /api/meshy/multi-image");
  }
}

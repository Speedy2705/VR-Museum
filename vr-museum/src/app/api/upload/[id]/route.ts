import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { uploadIdSchema, uploadUpdateSchema } from "@/lib/validators/upload";
import {
  deleteUpload,
  getUpload,
  updateUpload,
} from "@/server/services/upload.service";
import { ServiceError } from "@/lib/service-error";
import { storeDisplayPhoto, storeUploadFile } from "@/server/upload-media";

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
    let rawInput: unknown;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const type = form.get("type");
      if (type !== "3d-model" && type !== "video-scan") {
        throw new ServiceError("Choose a valid upload type", "INVALID_UPLOAD_TYPE", 400);
      }
      const metadata = JSON.parse(String(form.get("metadata") ?? "{}")) as Record<string, unknown>;
      const multipartInput: Record<string, unknown> = {
        title: form.get("title"),
        category: form.get("category"),
        mediaType: type === "video-scan" ? "VIDEO" : "MODEL_3D",
        lightingPreset: type === "3d-model" ? form.get("lightingPreset") : null,
        metadata,
      };
      rawInput = multipartInput;
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        const { stored, modelFormat } = await storeUploadFile(file, type);
        Object.assign(multipartInput, { fileUrl: stored.url, modelFormat });
        Object.assign(metadata, {
          originalFilename: file.name,
          storedFilename: stored.filename,
          contentType: stored.contentType,
          size: stored.size,
        });
      }
      const photo = form.get("photo");
      if (photo instanceof File && photo.size > 0) {
        const storedPhoto = await storeDisplayPhoto(photo);
        Object.assign(multipartInput, { thumbnailUrl: storedPhoto.url });
        Object.assign(metadata, { displayPhotoFilename: storedPhoto.filename });
      }
    } else {
      rawInput = await request.json();
    }
    const input = uploadUpdateSchema.parse(rawInput);
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

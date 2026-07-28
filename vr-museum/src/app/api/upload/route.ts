import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { uploadSchema } from "@/lib/validators/upload";
import { createUpload } from "@/server/services/upload.service";
import { fileStorage } from "@/server/storage";
import { ServiceError } from "@/lib/service-error";
import {
  type UploadMediaType,
  modelFormatFromExtension,
  validateUploadFile,
} from "@/lib/upload-file-policy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requirePermission(request, "upload");
    let rawInput: unknown;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new ServiceError(
          "A file is required",
          "FILE_REQUIRED",
          400,
        );
      }
      const type = form.get("type");
      if (type !== "3d-model" && type !== "video-scan") {
        throw new ServiceError(
          "Choose a valid upload type",
          "INVALID_UPLOAD_TYPE",
          400,
        );
      }
      const fileValidation = await validateUploadFile(
        file,
        type as UploadMediaType,
      );
      if (!fileValidation.valid) {
        throw new ServiceError(
          fileValidation.reason,
          "INVALID_UPLOAD_FILE",
          400,
        );
      }
      const photo = form.get("photo");
      if (!(photo instanceof File)) {
        throw new ServiceError(
          "A display photo is required",
          "PHOTO_REQUIRED",
          400,
        );
      }
      const allowedPhotoTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ]);
      if (!allowedPhotoTypes.has(photo.type) || photo.size > 10 * 1024 * 1024) {
        throw new ServiceError(
          "Use a JPG, PNG, WebP, or AVIF display photo no larger than 10 MB",
          "INVALID_DISPLAY_PHOTO",
          400,
        );
      }
      const stored = await fileStorage.save(file);
      const storedPhoto = await fileStorage.save(photo);
      const lighting = form.get("lighting");
      rawInput = {
        title: form.get("title"),
        category: form.get("category"),
        fileUrl: stored.url,
        thumbnailUrl: storedPhoto.url,
        mediaType: type === "video-scan" ? "VIDEO" : "MODEL_3D",
        modelFormat:
          type === "3d-model"
            ? modelFormatFromExtension(stored.extension)
            : null,
        lightingPreset:
          typeof lighting === "string" && lighting.length > 0 ? lighting : null,
        metadata: {
          type,
          origin: form.get("origin"),
          price: form.get("price") ? Number(form.get("price")) : null,
          license: form.get("license"),
          description: form.get("description"),
          originalFilename: file.name,
          storedFilename: stored.filename,
          contentType: stored.contentType,
          size: stored.size,
          displayPhotoFilename: storedPhoto.filename,
        },
      };
    } else {
      throw new ServiceError(
        "Uploads must use multipart/form-data with a model or video file",
        "MULTIPART_REQUIRED",
        415,
      );
    }
    const input = uploadSchema.parse(rawInput);
    return apiSuccess(await createUpload(user.id, input), {
      message: "Upload submitted for review",
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error, "POST /api/upload");
  }
}

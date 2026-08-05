import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { uploadSchema } from "@/lib/validators/upload";
import { createUpload } from "@/server/services/upload.service";
import { ServiceError } from "@/lib/service-error";
import { storeDisplayPhoto, storeUploadFile } from "@/server/upload-media";

export const dynamic = "force-dynamic";

function assertProductionBlobUrl(value: unknown) {
  if (process.env.NEXT_PUBLIC_BLOB_UPLOADS !== "true") return;
  if (typeof value !== "string") {
    throw new ServiceError("A stored media URL is required", "INVALID_BLOB_URL", 400);
  }
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com")) {
    throw new ServiceError("Media must come from the configured upload store", "INVALID_BLOB_URL", 400);
  }
}

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
      if (type !== "3d-model" && type !== "video-scan" && type !== "image-to-3d") {
        throw new ServiceError(
          "Choose a valid upload type",
          "INVALID_UPLOAD_TYPE",
          400,
        );
      }
      const { stored, modelFormat } = await storeUploadFile(file, type === "image-to-3d" ? "3d-model" : type);
      const photo = form.get("photo");
      if (!(photo instanceof File)) {
        throw new ServiceError(
          "A display photo is required",
          "PHOTO_REQUIRED",
          400,
        );
      }
      const storedPhoto = await storeDisplayPhoto(photo);
      const lighting = form.get("lighting");
      const lightTemperature = form.get("lightTemperature");
      const lightDirection = form.get("lightDirection");
      rawInput = {
        title: form.get("title"),
        category: form.get("category"),
        fileUrl: stored.url,
        thumbnailUrl: storedPhoto.url,
        mediaType: type === "video-scan" ? "VIDEO" : "MODEL_3D",
        modelFormat,
        lightingPreset:
          typeof lighting === "string" && lighting.length > 0 ? lighting : null,
        lightTemperature: typeof lightTemperature === "string" && lightTemperature ? lightTemperature : null,
        lightDirection: typeof lightDirection === "string" && lightDirection ? lightDirection : null,
        metadata: {
          type,
          origin: form.get("origin"),
          material: form.get("material"),
          price: form.get("price") ? Number(form.get("price")) : null,
          license: form.get("license"),
          description: form.get("description"),
          originalFilename: file.name,
          storedFilename: stored.filename,
          contentType: stored.contentType,
          size: stored.size,
          displayPhotoFilename: storedPhoto.filename,
        },
        translations: JSON.parse(String(form.get("translations") ?? "{}")),
      };
    } else if (
      process.env.NEXT_PUBLIC_BLOB_UPLOADS === "true" &&
      request.headers.get("content-type")?.includes("application/json")
    ) {
      rawInput = await request.json();
      const input = rawInput as Record<string, unknown>;
      assertProductionBlobUrl(input.fileUrl);
      assertProductionBlobUrl(input.thumbnailUrl);
    } else {
      throw new ServiceError("Uploads must use the configured media transport", "UNSUPPORTED_MEDIA_TYPE", 415);
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

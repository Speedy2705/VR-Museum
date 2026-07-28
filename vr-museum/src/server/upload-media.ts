import { ServiceError } from "@/lib/service-error";
import {
  modelFormatFromExtension,
  type UploadMediaType,
  validateUploadFile,
} from "@/lib/upload-file-policy";
import { fileStorage } from "@/server/storage";

const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

export async function storeUploadFile(file: File, type: UploadMediaType) {
  const validation = await validateUploadFile(file, type);
  if (!validation.valid) {
    throw new ServiceError(validation.reason, "INVALID_UPLOAD_FILE", 400);
  }
  const stored = await fileStorage.save(file);
  return {
    stored,
    modelFormat: type === "3d-model" ? modelFormatFromExtension(stored.extension) : null,
  };
}

export async function storeDisplayPhoto(photo: File) {
  if (!ALLOWED_PHOTO_TYPES.has(photo.type) || photo.size > MAX_PHOTO_SIZE) {
    throw new ServiceError(
      "Use a JPG, PNG, WebP, or AVIF display photo no larger than 10 MB",
      "INVALID_DISPLAY_PHOTO",
      400,
    );
  }
  return fileStorage.save(photo);
}

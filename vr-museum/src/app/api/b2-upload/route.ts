import path from "node:path";

import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { MAX_UPLOAD_FILE_SIZE } from "@/lib/upload-file-policy";
import { ServiceError } from "@/lib/service-error";
import { createB2ObjectKey, createB2UploadUrl, b2ObjectUrl } from "@/server/storage/b2";

export const dynamic = "force-dynamic";

const allowedExtensions = new Set([".glb", ".mp4", ".mov", ".webm", ".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export async function POST(request: Request) {
  try {
    await requirePermission(request, "upload");
    const input = await request.json() as { filename?: unknown; contentType?: unknown; size?: unknown };
    if (typeof input.filename !== "string" || typeof input.contentType !== "string" || typeof input.size !== "number") {
      throw new ServiceError("Valid file metadata is required", "INVALID_UPLOAD_FILE", 400);
    }
    const extension = path.extname(input.filename).toLowerCase();
    const limit = [".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(extension)
      ? 10 * 1024 * 1024
      : MAX_UPLOAD_FILE_SIZE;
    if (!allowedExtensions.has(extension) || input.size <= 0 || input.size > limit) {
      throw new ServiceError("The file type or size is not allowed", "INVALID_UPLOAD_FILE", 400);
    }
    const key = createB2ObjectKey(input.filename);
    return Response.json({
      uploadUrl: await createB2UploadUrl(key, input.contentType),
      url: b2ObjectUrl(key),
      pathname: key,
    });
  } catch (error) {
    return handleRouteError(error, "POST /api/b2-upload");
  }
}

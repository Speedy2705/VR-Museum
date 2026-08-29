import { ServiceError } from "@/lib/service-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { B2Storage, b2KeyFromUrl, createB2DownloadUrl } from "@/server/storage/b2";
import type { FileStorage } from "@/server/storage/storage";
import { BlobStorage } from "@/server/storage/vercel-blob.storage";
import { MAX_MODEL_FILE_SIZE, validateGlbBytes } from "@/lib/upload-file-policy";

const MESHY_ENDPOINT = "https://api.meshy.ai/openapi/v1";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function sourceStorage(): FileStorage {
  return process.env.STORAGE_PROVIDER === "backblaze-b2"
    ? new B2Storage()
    : new BlobStorage();
}

export type MeshyTaskStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";

export type MeshyMultiImageTask = {
  id: string;
  type: "multi-image-to-3d";
  status: MeshyTaskStatus;
  progress: number;
  model_urls?: {
    glb?: string;
    [format: string]: string | undefined;
  };
  task_error?: { message?: string };
};

function apiKey() {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new ServiceError("Meshy generation is not configured", "MESHY_NOT_CONFIGURED", 503);
  return key;
}

function taskPath(taskId: string) {
  const id = taskId.trim();
  if (!id || id.length > 512 || /[\u0000-\u001f/\\?#]/.test(id)) {
    throw new ServiceError("Invalid Meshy task ID", "INVALID_TASK_ID", 400);
  }
  return `/multi-image-to-3d/${encodeURIComponent(id)}`;
}

async function meshyRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${MESHY_ENDPOINT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !body) {
    const message = typeof body?.message === "string" ? body.message : "Meshy could not process this request";
    throw new ServiceError(message, "MESHY_API_ERROR", response.status >= 500 ? 502 : response.status || 502);
  }
  return body;
}

function normalizedImage(image: File, index: number) {
  if (!ALLOWED_IMAGE_TYPES.has(image.type) || !image.size || image.size > MAX_IMAGE_SIZE) {
    throw new ServiceError("Each view must be a JPG or PNG image no larger than 10 MB", "INVALID_SOURCE_IMAGE", 400);
  }
  const extension = image.type === "image/png" ? "png" : "jpg";
  return new File([image], `meshy-source-${index + 1}.${extension}`, { type: image.type });
}

async function uploadImage(image: File) {
  try {
    const stored = await sourceStorage().save(image);
    if (process.env.STORAGE_PROVIDER === "backblaze-b2") {
      const key = b2KeyFromUrl(stored.url);
      if (!key) throw new Error("B2 source image key is invalid");
      return { storageUrl: stored.url, meshyUrl: await createB2DownloadUrl(key) };
    }
    const url = new URL(stored.url);
    if (url.protocol !== "https:") throw new Error("Source image URL is not HTTPS");
    return { storageUrl: stored.url, meshyUrl: url.toString() };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    logger.error("Meshy source-image upload failed", { error });
    throw new ServiceError("A source image could not be uploaded to media storage", "MESHY_SOURCE_UPLOAD_FAILED", 502);
  }
}

function parseTask(body: Record<string, unknown>): MeshyMultiImageTask {
  const statuses = new Set<MeshyTaskStatus>(["PENDING", "IN_PROGRESS", "SUCCEEDED", "FAILED", "CANCELED"]);
  const modelUrls = body.model_urls && typeof body.model_urls === "object"
    ? body.model_urls as Record<string, unknown>
    : undefined;
  const taskError = body.task_error && typeof body.task_error === "object"
    ? body.task_error as Record<string, unknown>
    : undefined;
  if (
    typeof body.id !== "string" ||
    body.type !== "multi-image-to-3d" ||
    typeof body.status !== "string" ||
    !statuses.has(body.status as MeshyTaskStatus) ||
    typeof body.progress !== "number"
  ) {
    throw new ServiceError("Meshy returned an invalid task response", "MESHY_INVALID_RESPONSE", 502);
  }
  return {
    id: body.id,
    type: "multi-image-to-3d",
    status: body.status as MeshyTaskStatus,
    progress: body.progress,
    ...(modelUrls ? {
      model_urls: Object.fromEntries(
        Object.entries(modelUrls).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      ),
    } : {}),
    ...(taskError ? { task_error: { message: typeof taskError.message === "string" ? taskError.message : undefined } } : {}),
  };
}

async function rememberSourceImages(taskId: string, blobUrls: string[]) {
  try {
    await prisma.meshySourceUpload.create({ data: { taskId, blobUrls } });
  } catch (error) {
    logger.error("Meshy source-image cleanup could not be scheduled", { error, taskId });
  }
}

async function cleanupSourceImages(taskId: string) {
  try {
    const upload = await prisma.meshySourceUpload.findUnique({ where: { taskId } });
    if (!upload || upload.cleanedAt) return;
    await sourceStorage().delete(upload.blobUrls);
    await prisma.meshySourceUpload.updateMany({
      where: { taskId, cleanedAt: null },
      data: { cleanedAt: new Date() },
    });
  } catch (error) {
    logger.error("Meshy source-image cleanup failed and will be retried", { error, taskId });
  }
}

export async function createMultiImageTask(images: File[]) {
  if (images.length !== 3) throw new ServiceError("Exactly three views are required", "INVALID_IMAGE_COUNT", 400);
  apiKey();
  if (
    process.env.STORAGE_PROVIDER !== "backblaze-b2" &&
    !process.env.BLOB_READ_WRITE_TOKEN &&
    !process.env.BLOB_READ_WRITE_TOKEN_STORE_ID
  ) {
    throw new ServiceError("Blob storage is not configured for Meshy source images", "BLOB_NOT_CONFIGURED", 503);
  }
  const normalizedImages = images.map(normalizedImage);
  const uploadedImages = await Promise.all(normalizedImages.map(uploadImage));
  const result = await meshyRequest("/multi-image-to-3d", {
    method: "POST",
    body: JSON.stringify({
      image_urls: uploadedImages.map(({ meshyUrl }) => meshyUrl),
      should_texture: true,
      // Web delivery favors one 2K base-color texture and Meshy's lowest
      // adaptive polygon tier. PBR map generation can multiply GLB size.
      texture_resolution: "2k",
      enable_pbr: false,
      should_remesh: true,
      decimation_mode: 4,
      target_formats: ["glb"],
    }),
  });
  if (typeof result.result !== "string" || !result.result) {
    throw new ServiceError("Meshy did not return a task ID", "MESHY_INVALID_RESPONSE", 502);
  }
  await rememberSourceImages(result.result, uploadedImages.map(({ storageUrl }) => storageUrl));
  return { taskId: result.result };
}

export async function getMultiImageTask(taskId: string) {
  const task = parseTask(await meshyRequest(taskPath(taskId)));
  if (task.status === "SUCCEEDED" || task.status === "FAILED" || task.status === "CANCELED") {
    await cleanupSourceImages(task.id);
  }
  return task;
}

export async function downloadGeneratedGlb(taskId: string) {
  const task = await getMultiImageTask(taskId);
  const modelUrl = task.model_urls?.glb;
  if (task.status !== "SUCCEEDED" || !modelUrl) {
    throw new ServiceError("The generated model is not ready yet", "MODEL_NOT_READY", 409);
  }
  let failure = "The generated model could not be downloaded";
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(modelUrl, { cache: "no-store" });
    if (!response.ok) {
      failure = `Meshy returned HTTP ${response.status} while downloading the model`;
      continue;
    }
    const payload = await response.arrayBuffer();
    if (payload.byteLength > MAX_MODEL_FILE_SIZE) {
      throw new ServiceError("The generated model exceeds the 150 MB upload limit", "MESHY_MODEL_TOO_LARGE", 413);
    }
    const reason = validateGlbBytes(new Uint8Array(payload, 0, Math.min(payload.byteLength, 65_536)), payload.byteLength);
    if (!reason) {
      return new Response(payload, { headers: { "content-type": "model/gltf-binary" } });
    }
    failure = reason;
  }
  throw new ServiceError(`${failure} Please regenerate the model.`, "MESHY_DOWNLOAD_FAILED", 502);
}

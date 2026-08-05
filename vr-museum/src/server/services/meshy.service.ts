import { ServiceError } from "@/lib/service-error";

const MESHY_ENDPOINT = "https://api.meshy.ai/openapi/v1/multi-image-to-3d";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function apiKey() {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new ServiceError("Meshy generation is not configured", "MESHY_NOT_CONFIGURED", 503);
  return key;
}

async function meshyRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = typeof body?.message === "string" ? body.message : "Meshy could not process this request";
    throw new ServiceError(message, "MESHY_API_ERROR", response.status >= 500 ? 502 : response.status);
  }
  return body ?? {};
}

export async function createMultiImageTask(images: File[]) {
  if (images.length !== 3) {
    throw new ServiceError("Exactly three views are required", "INVALID_IMAGE_COUNT", 400);
  }
  const imageUrls = await Promise.all(images.map(async (image) => {
    if (!ALLOWED_IMAGE_TYPES.has(image.type) || !image.size || image.size > MAX_IMAGE_SIZE) {
      throw new ServiceError("Each view must be a JPG, PNG, or WebP image no larger than 10 MB", "INVALID_SOURCE_IMAGE", 400);
    }
    const encoded = Buffer.from(await image.arrayBuffer()).toString("base64");
    return `data:${image.type};base64,${encoded}`;
  }));
  const result = await meshyRequest(MESHY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ image_urls: imageUrls, should_texture: true, enable_pbr: true, target_formats: ["glb"] }),
  });
  if (typeof result.result !== "string") throw new ServiceError("Meshy did not return a task ID", "MESHY_INVALID_RESPONSE", 502);
  return { taskId: result.result };
}

export async function getMultiImageTask(taskId: string) {
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(taskId)) throw new ServiceError("Invalid Meshy task ID", "INVALID_TASK_ID", 400);
  return meshyRequest(`${MESHY_ENDPOINT}/${encodeURIComponent(taskId)}`);
}

export async function downloadGeneratedGlb(taskId: string) {
  const task = await getMultiImageTask(taskId);
  const modelUrls = task.model_urls as Record<string, unknown> | undefined;
  if (task.status !== "SUCCEEDED" || typeof modelUrls?.glb !== "string") {
    throw new ServiceError("The generated model is not ready yet", "MODEL_NOT_READY", 409);
  }
  const response = await fetch(modelUrls.glb, { cache: "no-store" });
  if (!response.ok) throw new ServiceError("The generated model could not be downloaded", "MESHY_DOWNLOAD_FAILED", 502);
  return response;
}

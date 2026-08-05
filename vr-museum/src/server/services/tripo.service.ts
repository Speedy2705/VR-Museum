import { ServiceError } from "@/lib/service-error";

const TRIPO_ENDPOINT = "https://openapi.tripo3d.com/v3";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type TripoEnvelope = {
  code?: number;
  message?: string;
  data?: Record<string, unknown>;
};

function apiKey() {
  const key = process.env.TRIPO_API_KEY;
  if (!key) throw new ServiceError("Tripo generation is not configured", "TRIPO_NOT_CONFIGURED", 503);
  return key;
}

async function tripoRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${TRIPO_ENDPOINT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as TripoEnvelope | null;
  if (!response.ok || body?.code !== 0 || !body.data) {
    const message = typeof body?.message === "string" ? body.message : "Tripo could not process this request";
    throw new ServiceError(message, "TRIPO_API_ERROR", response.status >= 500 ? 502 : response.status || 502);
  }
  return body.data;
}

function imageFormat(image: File) {
  if (image.type === "image/png") return "png";
  if (image.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadImage(image: File) {
  if (!ALLOWED_IMAGE_TYPES.has(image.type) || !image.size || image.size > MAX_IMAGE_SIZE) {
    throw new ServiceError("Each view must be a JPG, PNG, or WebP image no larger than 10 MB", "INVALID_SOURCE_IMAGE", 400);
  }
  const presigned = await tripoRequest("/files/presign", {
    method: "POST",
    body: JSON.stringify({ format: imageFormat(image) }),
  });
  if (typeof presigned.presigned_url !== "string" || typeof presigned.file_token !== "string") {
    throw new ServiceError("Tripo did not return an image upload token", "TRIPO_INVALID_RESPONSE", 502);
  }
  const uploaded = await fetch(presigned.presigned_url, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream" },
    body: image,
  });
  if (!uploaded.ok) throw new ServiceError("A source image could not be uploaded to Tripo", "TRIPO_UPLOAD_FAILED", 502);
  return presigned.file_token;
}

export async function createMultiImageTask(images: File[]) {
  if (images.length !== 3) throw new ServiceError("Exactly three views are required", "INVALID_IMAGE_COUNT", 400);
  const [front, side, back] = await Promise.all(images.map(uploadImage));
  const result = await tripoRequest("/generation/multiview-to-model", {
    method: "POST",
    body: JSON.stringify({
      inputs: [{ front }, { right: side }, { back }],
      model: "v3.1-20260211",
      texture: true,
      pbr: true,
    }),
  });
  if (typeof result.task_id !== "string") throw new ServiceError("Tripo did not return a task ID", "TRIPO_INVALID_RESPONSE", 502);
  return { taskId: result.task_id };
}

export async function getMultiImageTask(taskId: string) {
  if (!/^task_[a-zA-Z0-9-]{3,120}$/.test(taskId)) throw new ServiceError("Invalid Tripo task ID", "INVALID_TASK_ID", 400);
  return tripoRequest(`/tasks/${encodeURIComponent(taskId)}`);
}

export async function downloadGeneratedGlb(taskId: string) {
  const task = await getMultiImageTask(taskId);
  const output = task.output as Record<string, unknown> | undefined;
  if (task.status !== "success" || typeof output?.model_url !== "string") {
    throw new ServiceError("The generated model is not ready yet", "MODEL_NOT_READY", 409);
  }
  const response = await fetch(output.model_url, { cache: "no-store" });
  if (!response.ok) throw new ServiceError("The generated model could not be downloaded", "TRIPO_DOWNLOAD_FAILED", 502);
  return response;
}

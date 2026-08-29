import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { save, remove, b2Save, b2Remove, createB2DownloadUrl, createCleanup, findCleanup, updateCleanup } = vi.hoisted(() => ({
  save: vi.fn(),
  remove: vi.fn(),
  b2Save: vi.fn(),
  b2Remove: vi.fn(),
  createB2DownloadUrl: vi.fn(),
  createCleanup: vi.fn(),
  findCleanup: vi.fn(),
  updateCleanup: vi.fn(),
}));

vi.mock("@/server/storage/vercel-blob.storage", () => ({
  BlobStorage: class {
    save = save;
    delete = remove;
  },
}));

vi.mock("@/server/storage/b2", () => ({
  B2Storage: class {
    save = b2Save;
    delete = b2Remove;
  },
  b2KeyFromUrl: (url: string) => url.startsWith("/api/media/") ? url.slice("/api/media/".length) : null,
  createB2DownloadUrl,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshySourceUpload: {
      create: createCleanup,
      findUnique: findCleanup,
      updateMany: updateCleanup,
    },
  },
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { createMultiImageTask, downloadGeneratedGlb, getMultiImageTask } from "@/server/services/meshy.service";

function images(type = "image/jpeg") {
  return ["front", "side", "back"].map((name) => new File([name], `${name}.jpg`, { type }));
}

describe("Meshy multi-image service", () => {
  beforeEach(() => {
    process.env.MESHY_API_KEY = "test-meshy-key";
    process.env.BLOB_READ_WRITE_TOKEN_STORE_ID = "test-store-id";
    save.mockReset();
    remove.mockReset();
    b2Save.mockReset();
    b2Remove.mockReset();
    createB2DownloadUrl.mockReset();
    createCleanup.mockReset();
    findCleanup.mockReset();
    updateCleanup.mockReset();
    createCleanup.mockResolvedValue({});
    findCleanup.mockResolvedValue(null);
    updateCleanup.mockResolvedValue({ count: 1 });
    remove.mockResolvedValue(undefined);
    b2Remove.mockResolvedValue(undefined);
    createB2DownloadUrl.mockImplementation(async (key: string) => `https://signed-b2.example/${key}`);
    save.mockImplementation(async (file: File) => ({
      url: `https://blob.example/${file.name}`,
      filename: file.name,
      extension: file.type === "image/png" ? ".png" : ".jpg",
      contentType: file.type,
      size: file.size,
    }));
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MESHY_API_KEY;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN_STORE_ID;
    delete process.env.STORAGE_PROVIDER;
  });

  it("uploads normalized public images and creates a GLB task", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ result: "task-123" }), { status: 200 }));

    await expect(createMultiImageTask(images())).resolves.toEqual({ taskId: "task-123" });
    expect(save).toHaveBeenCalledTimes(3);
    expect(createCleanup).toHaveBeenCalledWith({
      data: {
        taskId: "task-123",
        blobUrls: [
          "https://blob.example/meshy-source-1.jpg",
          "https://blob.example/meshy-source-2.jpg",
          "https://blob.example/meshy-source-3.jpg",
        ],
      },
    });
    expect(save.mock.calls.map(([file]) => (file as File).name)).toEqual([
      "meshy-source-1.jpg",
      "meshy-source-2.jpg",
      "meshy-source-3.jpg",
    ]);
    expect(fetch).toHaveBeenCalledWith("https://api.meshy.ai/openapi/v1/multi-image-to-3d", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer test-meshy-key" }),
      body: JSON.stringify({
        image_urls: [
          "https://blob.example/meshy-source-1.jpg",
          "https://blob.example/meshy-source-2.jpg",
          "https://blob.example/meshy-source-3.jpg",
        ],
        should_texture: true,
        texture_resolution: "2k",
        enable_pbr: false,
        should_remesh: true,
        decimation_mode: 4,
        target_formats: ["glb"],
      }),
    }));
  });

  it("rejects WebP before uploading anything", async () => {
    await expect(createMultiImageTask(images("image/webp"))).rejects.toMatchObject({
      code: "INVALID_SOURCE_IMAGE",
      status: 400,
    });
    expect(save).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires a Meshy API key before uploading or calling the network", async () => {
    delete process.env.MESHY_API_KEY;

    await expect(createMultiImageTask(images())).rejects.toMatchObject({
      code: "MESHY_NOT_CONFIGURED",
      status: 503,
    });
    expect(save).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("accepts a legacy Blob read-write token when OIDC is unavailable", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN_STORE_ID;
    process.env.BLOB_READ_WRITE_TOKEN = "test-blob-token";
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ result: "task-legacy" }), { status: 200 }));

    await expect(createMultiImageTask(images())).resolves.toEqual({ taskId: "task-legacy" });
  });

  it("uploads private B2 source images and sends signed download URLs to Meshy", async () => {
    process.env.STORAGE_PROVIDER = "backblaze-b2";
    delete process.env.BLOB_READ_WRITE_TOKEN_STORE_ID;
    b2Save.mockImplementation(async (file: File) => ({
      url: `/api/media/uploads/${file.name}`,
      filename: file.name,
      extension: ".jpg",
      contentType: file.type,
      size: file.size,
    }));
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ result: "task-b2" }), { status: 200 }));

    await expect(createMultiImageTask(images())).resolves.toEqual({ taskId: "task-b2" });
    expect(b2Save).toHaveBeenCalledTimes(3);
    expect(createB2DownloadUrl).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenCalledWith("https://api.meshy.ai/openapi/v1/multi-image-to-3d", expect.objectContaining({
      body: expect.stringContaining("https://signed-b2.example/uploads/meshy-source-1.jpg"),
    }));
    expect(createCleanup).toHaveBeenCalledWith({
      data: {
        taskId: "task-b2",
        blobUrls: [
          "/api/media/uploads/meshy-source-1.jpg",
          "/api/media/uploads/meshy-source-2.jpg",
          "/api/media/uploads/meshy-source-3.jpg",
        ],
      },
    });
  });

  it("requires either a Blob OIDC store ID or a legacy read-write token", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;

    await expect(createMultiImageTask(images())).rejects.toMatchObject({
      code: "BLOB_NOT_CONFIGURED",
      status: 503,
    });
    expect(save).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects an oversized image before Blob storage or Meshy is called", async () => {
    const sourceImages = images();
    Object.defineProperty(sourceImages[1], "size", { value: 10 * 1024 * 1024 + 1 });

    await expect(createMultiImageTask(sourceImages)).rejects.toMatchObject({
      code: "INVALID_SOURCE_IMAGE",
      status: 400,
    });
    expect(save).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { upstream: 400, expected: 400 },
    { upstream: 401, expected: 401 },
    { upstream: 429, expected: 429 },
    { upstream: 500, expected: 502 },
  ])("maps Meshy $upstream responses to status $expected", async ({ upstream, expected }) => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "Meshy rejected the request" }), { status: upstream }));

    await expect(createMultiImageTask(images())).rejects.toMatchObject({
      message: "Meshy rejected the request",
      code: "MESHY_API_ERROR",
      status: expected,
    });
    expect(createCleanup).not.toHaveBeenCalled();
  });

  it("parses documented task statuses and GLB output", async () => {
    findCleanup.mockResolvedValue({
      taskId: "task-123",
      blobUrls: ["https://blob.example/front.jpg", "https://blob.example/side.jpg", "https://blob.example/back.jpg"],
      cleanedAt: null,
    });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      id: "task-123",
      type: "multi-image-to-3d",
      status: "SUCCEEDED",
      progress: 100,
      model_urls: { glb: "https://assets.meshy.ai/model.glb" },
      task_error: { message: "" },
    }), { status: 200 }));

    await expect(getMultiImageTask("task-123")).resolves.toMatchObject({
      id: "task-123",
      status: "SUCCEEDED",
      progress: 100,
      model_urls: { glb: "https://assets.meshy.ai/model.glb" },
    });
    expect(remove).toHaveBeenCalledWith([
      "https://blob.example/front.jpg",
      "https://blob.example/side.jpg",
      "https://blob.example/back.jpg",
    ]);
    expect(updateCleanup).toHaveBeenCalledWith(expect.objectContaining({
      where: { taskId: "task-123", cleanedAt: null },
    }));
  });

  it("returns the generated GLB response only after success", async () => {
    const glb = new ArrayBuffer(24);
    const view = new DataView(glb);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, 24, true);
    view.setUint32(12, 4, true);
    view.setUint32(16, 0x4e4f534a, true);
    new Uint8Array(glb).set([0x7b, 0x7d, 0x20, 0x20], 20);
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "task-123",
        type: "multi-image-to-3d",
        status: "SUCCEEDED",
        progress: 100,
        model_urls: { glb: "https://assets.meshy.ai/model.glb" },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(glb, { status: 200, headers: { "content-type": "model/gltf-binary" } }));

    const response = await downloadGeneratedGlb("task-123");
    expect(await response.arrayBuffer()).toEqual(glb);
  });

  it("retries and rejects an incomplete generated GLB", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "task-123",
        type: "multi-image-to-3d",
        status: "SUCCEEDED",
        progress: 100,
        model_urls: { glb: "https://assets.meshy.ai/model.glb" },
      }), { status: 200 }))
      .mockImplementation(() => Promise.resolve(new Response("not-a-glb", { status: 200 })));

    await expect(downloadGeneratedGlb("task-123")).rejects.toMatchObject({
      code: "MESHY_DOWNLOAD_FAILED",
      status: 502,
    });
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("rejects a download while the task is still in progress", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      id: "task-123",
      type: "multi-image-to-3d",
      status: "IN_PROGRESS",
      progress: 42,
    }), { status: 200 }));

    await expect(downloadGeneratedGlb("task-123")).rejects.toMatchObject({
      code: "MODEL_NOT_READY",
      status: 409,
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(remove).not.toHaveBeenCalled();
  });
});

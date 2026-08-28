import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getB2Object: vi.fn() }));
vi.mock("@/server/storage/b2", () => ({ getB2Object: mocks.getB2Object }));

import { GET } from "./route";

const originalProvider = process.env.STORAGE_PROVIDER;
const context = (key: string[]) => ({ params: Promise.resolve({ key }) });

beforeEach(() => {
  process.env.STORAGE_PROVIDER = "backblaze-b2";
  mocks.getB2Object.mockReset();
});

afterEach(() => {
  if (originalProvider === undefined) delete process.env.STORAGE_PROVIDER;
  else process.env.STORAGE_PROVIDER = originalProvider;
});

describe("B2 media proxy", () => {
  it("streams an object through the same-origin route", async () => {
    mocks.getB2Object.mockResolvedValue({
      Body: { transformToWebStream: () => new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("model")); controller.close(); } }) },
      ContentLength: 5,
      ContentType: "model/gltf-binary",
      ETag: "etag",
    });
    const response = await GET(new Request("http://museum/api/media/uploads/model.glb"), context(["uploads", "model.glb"]));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("model/gltf-binary");
    expect(await response.text()).toBe("model");
  });

  it("forwards byte ranges and returns a partial response", async () => {
    mocks.getB2Object.mockResolvedValue({
      Body: { transformToWebStream: () => new ReadableStream({ start(controller) { controller.close(); } }) },
      ContentLength: 10,
      ContentRange: "bytes 0-9/100",
    });
    const request = new Request("http://museum/api/media/uploads/model.glb", { headers: { range: "bytes=0-9" } });
    const response = await GET(request, context(["uploads", "model.glb"]));
    expect(mocks.getB2Object).toHaveBeenCalledWith("uploads/model.glb", "bytes=0-9");
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-9/100");
  });

  it("rejects keys outside the uploads directory", async () => {
    const response = await GET(new Request("http://museum/api/media/private/model.glb"), context(["private", "model.glb"]));
    expect(response.status).toBe(400);
    expect(mocks.getB2Object).not.toHaveBeenCalled();
  });
});

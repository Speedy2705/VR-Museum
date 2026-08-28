import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@vercel/blob", () => ({ get: mocks.get }));

import { GET } from "./route";

const legacyUrl = "https://museum.public.blob.vercel-storage.com/uploads/model.glb";
const request = (headers?: HeadersInit) => new Request(
  `http://localhost/api/media/legacy?url=${encodeURIComponent(legacyUrl)}`,
  { headers },
);
const stream = (value: string) => new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode(value));
    controller.close();
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
  mocks.get.mockReset();
});

describe("legacy Vercel Blob media proxy", () => {
  it("streams a still-public legacy object", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream("public"), {
      status: 200,
      headers: { "content-type": "model/gltf-binary" },
    })));
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("public");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("uses authenticated SDK recovery when public access is denied", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    mocks.get.mockResolvedValue({
      stream: stream("recovered"),
      headers: new Headers({ "content-type": "model/gltf-binary" }),
    });
    const response = await GET(request({ range: "bytes=0-9" }));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("recovered");
    expect(mocks.get).toHaveBeenCalledWith(legacyUrl, expect.objectContaining({
      access: "public",
      headers: { range: "bytes=0-9" },
    }));
  });

  it("rejects non-Vercel URLs", async () => {
    const response = await GET(new Request("http://localhost/api/media/legacy?url=https://example.com/model.glb"));
    expect(response.status).toBe(400);
  });
});

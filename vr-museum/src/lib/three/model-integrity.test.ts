import { describe, expect, it } from "vitest";
import { validateModelPayload } from "./model-integrity";

function glb(document: object) {
  const encoded = new TextEncoder().encode(JSON.stringify(document));
  const paddedLength = Math.ceil(encoded.length / 4) * 4;
  const bytes = new Uint8Array(20 + paddedLength);
  bytes.set(new TextEncoder().encode("glTF"));
  const view = new DataView(bytes.buffer);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20);
  bytes.set(encoded, 20);
  return bytes;
}

describe("validateModelPayload", () => {
  it("accepts a self-contained GLB", () => {
    expect(() => validateModelPayload("glb", glb({ asset: { version: "2.0" }, buffers: [{}] }))).not.toThrow();
  });

  it("rejects external GLB dependencies", () => {
    expect(() => validateModelPayload("glb", glb({ asset: { version: "2.0" }, images: [{ uri: "texture.png" }] }))).toThrow(/external file/);
  });

  it("rejects a truncated GLB", () => {
    expect(() => validateModelPayload("glb", new Uint8Array([1, 2, 3]))).toThrow(/signature/);
  });
});

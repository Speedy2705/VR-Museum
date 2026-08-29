import { describe, expect, it } from "vitest";
import { validateGlbBytes, validateModelFile } from "./upload-file-policy";

function minimalGlb(declaredLength = 24) {
  const buffer = new ArrayBuffer(24);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, declaredLength, true);
  view.setUint32(12, 4, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(buffer).set([0x7b, 0x7d, 0x20, 0x20], 20);
  return buffer;
}

describe("GLB validation", () => {
  it("accepts a complete GLB 2 container", async () => {
    const buffer = minimalGlb();
    expect(validateGlbBytes(new Uint8Array(buffer), buffer.byteLength)).toBeNull();
    await expect(validateModelFile(new File([buffer], "model.glb", { type: "model/gltf-binary" })))
      .resolves.toEqual({ valid: true, extension: ".glb" });
  });

  it("rejects a truncated download using its declared length", () => {
    const buffer = minimalGlb(48);
    expect(validateGlbBytes(new Uint8Array(buffer), buffer.byteLength)).toBe("The generated GLB download is incomplete.");
  });

  it("rejects a non-GLB response", () => {
    const bytes = new TextEncoder().encode("Meshy error response");
    expect(validateGlbBytes(bytes, bytes.byteLength)).toBe("The downloaded file is not a GLB model.");
  });
});

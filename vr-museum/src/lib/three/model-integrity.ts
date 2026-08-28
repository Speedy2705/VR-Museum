import type { ModelFormat } from "@/lib/three/loaders";

const GLB_JSON_CHUNK = 0x4e4f534a;

function assertSelfContainedGltf(document: unknown) {
  if (!document || typeof document !== "object") throw new Error("glTF JSON is missing");
  const value = document as { asset?: { version?: string }; buffers?: Array<{ uri?: string }>; images?: Array<{ uri?: string }> };
  if (!value.asset?.version?.startsWith("2")) throw new Error("glTF 2.x metadata is missing");
  const external = [...(value.buffers ?? []), ...(value.images ?? [])]
    .map((resource) => resource.uri)
    .filter((uri): uri is string => typeof uri === "string" && uri.length > 0 && !uri.startsWith("data:"));
  if (external.length) throw new Error(`Model references ${external.length} external file(s)`);
}

export function validateModelPayload(format: ModelFormat, bytes: Uint8Array) {
  if (!bytes.byteLength) throw new Error("Model file is empty");
  if (format === "glb") {
    if (bytes.byteLength < 20 || new TextDecoder().decode(bytes.subarray(0, 4)) !== "glTF") throw new Error("Invalid GLB signature");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(4, true) !== 2) throw new Error("Only GLB version 2 is supported");
    if (view.getUint32(8, true) !== bytes.byteLength) throw new Error("GLB length header does not match the file");
    const jsonLength = view.getUint32(12, true);
    if (view.getUint32(16, true) !== GLB_JSON_CHUNK || 20 + jsonLength > bytes.byteLength) throw new Error("GLB JSON chunk is invalid");
    const json = new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)).replace(/[\u0000 ]+$/g, "");
    assertSelfContainedGltf(JSON.parse(json));
    return;
  }
  const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, "").trimStart();
  if (format === "gltf") {
    assertSelfContainedGltf(JSON.parse(text));
    return;
  }
  if (format === "obj") {
    if (!text.split(/\r?\n/).some((line) => /^(?:v|f)\s/.test(line.trimStart()))) throw new Error("OBJ geometry declarations are missing");
    return;
  }
  const asciiStl = text.toLowerCase().startsWith("solid") && /\bfacet\s+normal\b/i.test(text);
  const binaryStl = bytes.byteLength >= 84 && bytes.byteLength === 84 + new DataView(bytes.buffer, bytes.byteOffset + 80, 4).getUint32(0, true) * 50;
  if (!asciiStl && !binaryStl) throw new Error("STL structure is invalid");
}

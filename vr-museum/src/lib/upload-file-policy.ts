export const ALLOWED_MODEL_EXTENSIONS = [".glb", ".gltf", ".obj", ".stl"] as const;
export const MODEL_FILE_ACCEPT = ALLOWED_MODEL_EXTENSIONS.join(",");
export const MAX_MODEL_FILE_SIZE = 150 * 1024 * 1024;
export const MAX_MODEL_FILE_SIZE_LABEL = "150 MB";
export const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"] as const;
export const VIDEO_FILE_ACCEPT = ALLOWED_VIDEO_EXTENSIONS.join(",");
export const MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024;
export const MAX_VIDEO_FILE_SIZE_LABEL = "200 MB";
export const MAX_UPLOAD_FILE_SIZE = MAX_VIDEO_FILE_SIZE;

export type UploadMediaType = "3d-model" | "video-scan";

const MIME_TYPES: Record<(typeof ALLOWED_MODEL_EXTENSIONS)[number], readonly string[]> = {
  ".glb": ["model/gltf-binary", "application/octet-stream", ""],
  ".gltf": ["model/gltf+json", "application/json", "text/plain", ""],
  ".obj": ["text/plain", "model/obj", "application/octet-stream", ""],
  ".stl": ["model/stl", "application/sla", "application/octet-stream", ""],
};

const VIDEO_MIME_TYPES: Record<(typeof ALLOWED_VIDEO_EXTENSIONS)[number], readonly string[]> = {
  ".mp4": ["video/mp4", "application/mp4"],
  ".mov": ["video/quicktime"],
  ".webm": ["video/webm"],
};

export function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot < 0 ? "" : filename.slice(dot).toLowerCase();
}

export type ModelFormat = "glb" | "gltf" | "obj" | "stl";

export function modelFormatFromExtension(
  extension: string,
): ModelFormat | null {
  const normalized = extension.startsWith(".")
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;
  return ALLOWED_MODEL_EXTENSIONS.includes(normalized as never)
    ? (normalized.slice(1) as ModelFormat)
    : null;
}

export type FileValidationResult =
  | {
      valid: true;
      extension:
        | (typeof ALLOWED_MODEL_EXTENSIONS)[number]
        | (typeof ALLOWED_VIDEO_EXTENSIONS)[number];
    }
  | { valid: false; reason: string };

export async function validateModelFile(file: File): Promise<FileValidationResult> {
  const extension = extensionOf(file.name);
  if (!ALLOWED_MODEL_EXTENSIONS.includes(extension as never)) {
    return {
      valid: false,
      reason: `Unsupported format. Choose ${ALLOWED_MODEL_EXTENSIONS.join(", ")}.`,
    };
  }
  const typedExtension = extension as (typeof ALLOWED_MODEL_EXTENSIONS)[number];
  if (!file.size) {
    return { valid: false, reason: "The selected file is empty." };
  }
  if (file.size > MAX_MODEL_FILE_SIZE) {
    return {
      valid: false,
      reason: `The model exceeds the ${MAX_MODEL_FILE_SIZE_LABEL} limit.`,
    };
  }
  if (!MIME_TYPES[typedExtension].includes(file.type.toLowerCase())) {
    return {
      valid: false,
      reason: `The file’s MIME type (${file.type || "unknown"}) does not match ${typedExtension}.`,
    };
  }

  const bytes = new Uint8Array(await file.slice(0, 65_536).arrayBuffer());
  if (typedExtension === ".glb") {
    const header = bytes.length >= 12
      ? new DataView(bytes.buffer, bytes.byteOffset, 12)
      : null;
    if (
      !header ||
      String.fromCharCode(...bytes.slice(0, 4)) !== "glTF" ||
      header.getUint32(4, true) !== 2 ||
      header.getUint32(8, true) !== file.size
    ) {
      return { valid: false, reason: "The file does not contain a valid GLB signature." };
    }
  } else if (typedExtension === ".gltf") {
    const header = new TextDecoder().decode(bytes).replace(/^\uFEFF/, "").trimStart();
    if (!header.startsWith("{") || !/"asset"\s*:/.test(header) || !/"version"\s*:/.test(header)) {
      return { valid: false, reason: "The file does not contain valid glTF JSON metadata." };
    }
  } else if (typedExtension === ".obj") {
    const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, "");
    const hasObjToken = text.split(/\r?\n/).some((line) => {
      const trimmed = line.trimStart();
      return trimmed !== "" && !trimmed.startsWith("#") && /^(?:(?:v|vt|vn|f|o|g)\s|(?:mtllib|usemtl)\s)/.test(trimmed);
    });
    if (!hasObjToken) return { valid: false, reason: "The file does not contain a recognized OBJ declaration." };
  } else {
    const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, "").trimStart();
    const isAscii = text.toLowerCase().startsWith("solid");
    let isBinary = false;
    if (bytes.length >= 84) {
      const count = new DataView(bytes.buffer, bytes.byteOffset + 80, 4).getUint32(0, true);
      isBinary = file.size === 84 + count * 50;
    }
    if (!isAscii && !isBinary) return { valid: false, reason: "The file does not contain a valid ASCII or binary STL signature." };
  }

  return { valid: true, extension: typedExtension };
}

export async function validateVideoFile(file: File): Promise<FileValidationResult> {
  const extension = extensionOf(file.name);
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(extension as never)) {
    return {
      valid: false,
      reason: `Unsupported video format. Choose ${ALLOWED_VIDEO_EXTENSIONS.join(", ")}.`,
    };
  }
  const typedExtension = extension as (typeof ALLOWED_VIDEO_EXTENSIONS)[number];
  if (!file.size) {
    return { valid: false, reason: "The selected file is empty." };
  }
  if (file.size > MAX_VIDEO_FILE_SIZE) {
    return {
      valid: false,
      reason: `The video exceeds the ${MAX_VIDEO_FILE_SIZE_LABEL} limit.`,
    };
  }
  if (!VIDEO_MIME_TYPES[typedExtension].includes(file.type.toLowerCase())) {
    return {
      valid: false,
      reason: `The file’s MIME type (${file.type || "unknown"}) does not match ${typedExtension}.`,
    };
  }

  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (typedExtension === ".webm") {
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x1a ||
      bytes[1] !== 0x45 ||
      bytes[2] !== 0xdf ||
      bytes[3] !== 0xa3
    ) {
      return { valid: false, reason: "The file does not contain a valid WebM signature." };
    }
  } else {
    const boxType = bytes.length >= 8
      ? String.fromCharCode(...bytes.slice(4, 8))
      : "";
    if (boxType !== "ftyp") {
      return {
        valid: false,
        reason: `The file does not contain a valid ${typedExtension === ".mov" ? "MOV" : "MP4"} signature.`,
      };
    }
  }

  return { valid: true, extension: typedExtension };
}

export function validateUploadFile(file: File, type: UploadMediaType) {
  return type === "video-scan"
    ? validateVideoFile(file)
    : validateModelFile(file);
}

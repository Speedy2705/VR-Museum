// New uploads must be a single self-contained asset. Legacy catalog entries
// may still be viewed through the loaders for GLTF, OBJ, and STL.
export const ALLOWED_MODEL_EXTENSIONS = [".glb"] as const;
export const MODEL_FILE_ACCEPT = ALLOWED_MODEL_EXTENSIONS.join(",");
export const MAX_MODEL_FILE_SIZE = 150 * 1024 * 1024;
export const MAX_MODEL_FILE_SIZE_LABEL = "150 MB";
export const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"] as const;
export const VIDEO_FILE_ACCEPT = ALLOWED_VIDEO_EXTENSIONS.join(",");
export const MAX_VIDEO_FILE_SIZE = 150 * 1024 * 1024;
export const MAX_VIDEO_FILE_SIZE_LABEL = "150 MB";
export const MAX_UPLOAD_FILE_SIZE = MAX_MODEL_FILE_SIZE;

export type UploadMediaType = "3d-model" | "video-scan";

const MIME_TYPES: Record<(typeof ALLOWED_MODEL_EXTENSIONS)[number], readonly string[]> = {
  ".glb": ["model/gltf-binary", "application/octet-stream", ""],
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

export type ModelFormat = "glb";

const GLB_MAGIC = 0x46546c67;
const GLB_JSON_CHUNK = 0x4e4f534a;

export function validateGlbBytes(bytes: Uint8Array, totalSize: number): string | null {
  if (bytes.byteLength < 20 || totalSize < 20) return "The generated GLB is incomplete.";
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (header.getUint32(0, true) !== GLB_MAGIC) return "The downloaded file is not a GLB model.";
  if (header.getUint32(4, true) !== 2) return "The generated model uses an unsupported GLB version.";
  if (header.getUint32(8, true) !== totalSize) return "The generated GLB download is incomplete.";
  const jsonLength = header.getUint32(12, true);
  if (header.getUint32(16, true) !== GLB_JSON_CHUNK || jsonLength < 2 || 20 + jsonLength > totalSize) {
    return "The generated GLB has an invalid scene description.";
  }
  return null;
}

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
    const reason = validateGlbBytes(bytes, file.size);
    if (reason) return { valid: false, reason };
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

import { z } from "zod";
import {
  ALLOWED_MODEL_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
} from "@/lib/upload-file-policy";

const hasAllowedExtension = (value: string, extensions: readonly string[]) => {
  try {
    const pathname = new URL(value, "http://museum.local").pathname.toLowerCase();
    return extensions.some((extension) => pathname.endsWith(extension));
  } catch {
    return false;
  }
};

export const modelFormatSchema = z.enum(["glb", "gltf", "obj", "stl"]);
export const artifactMediaTypeSchema = z.enum(["IMAGE", "VIDEO", "MODEL_3D"]);
export const modelUrlSchema = z.string().trim().min(1).max(2_000).refine(
  (value) => hasAllowedExtension(value, ALLOWED_MODEL_EXTENSIONS),
  "Model URL must use a supported model extension",
);
export const videoUrlSchema = z.string().trim().min(1).max(2_000).refine(
  (value) => hasAllowedExtension(value, ALLOWED_VIDEO_EXTENSIONS),
  "Video URL must use a supported video extension",
);

export const artifactSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).optional(),
  collectionId: z.string().trim().min(1),
  videoUrl: videoUrlSchema.nullable().optional(),
  modelUrl: modelUrlSchema.nullable().optional(),
  modelFormat: modelFormatSchema.nullable().optional(),
  primaryMediaType: artifactMediaTypeSchema.optional(),
}).superRefine((input, context) => {
  if (input.modelUrl && !input.modelFormat) {
    context.addIssue({
      code: "custom",
      path: ["modelFormat"],
      message: "Model format is required when a model URL is provided",
    });
  }
  if (input.modelUrl && input.modelFormat &&
      !input.modelUrl.toLowerCase().split(/[?#]/)[0].endsWith(`.${input.modelFormat}`)) {
    context.addIssue({
      code: "custom",
      path: ["modelFormat"],
      message: "Model format must match the model URL extension",
    });
  }
  if (input.primaryMediaType === "VIDEO" && !input.videoUrl) {
    context.addIssue({
      code: "custom",
      path: ["videoUrl"],
      message: "A video URL is required when video is the primary media",
    });
  }
  if (input.primaryMediaType === "MODEL_3D" && !input.modelUrl) {
    context.addIssue({
      code: "custom",
      path: ["modelUrl"],
      message: "A model URL is required when a 3D model is the primary media",
    });
  }
});

export const artifactListQuerySchema = z.object({
  collection: z.string().trim().min(1).max(200).optional(),
  preset: z.string().trim().min(1).max(200).optional(),
  query: z.string().trim().min(1).max(200).optional(),
});

export const artifactSlugSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});

export type ArtifactInput = z.infer<typeof artifactSchema>;

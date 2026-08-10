import { z } from "zod";
import { ARTIFACT_CATEGORIES } from "@/lib/artifact-categories";
import {
  artifactMediaTypeSchema,
  modelFormatSchema,
  modelUrlSchema,
  videoUrlSchema,
} from "@/lib/validators/artifact";

const categoryKeys = ARTIFACT_CATEGORIES.map(({ key }) => key) as [
  (typeof ARTIFACT_CATEGORIES)[number]["key"],
  ...(typeof ARTIFACT_CATEGORIES)[number]["key"][],
];
const categorySchema = z.enum(categoryKeys);
const lightingPresetSchema = z.enum(["warm-diffuse", "directional-spot", "cool-ambient", "backlit-halo", "raking-light"]);
const lightTemperatureSchema = z.enum(["warm-white", "cool-white", "artificial-daylight"]);
const lightDirectionSchema = z.enum(["spotlight", "top-light", "front-facing", "raking-light", "backlight"]);
const localizedUploadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(40).max(2_000),
  origin: z.string().trim().min(1).max(200),
  material: z.string().trim().min(1).max(120),
});
const translationsSchema = z.object({
  en: localizedUploadSchema,
});

const uploadBaseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: categorySchema,
  fileUrl: z.string().trim().min(1).max(2_000),
  thumbnailUrl: z.string().trim().max(2_000).nullable().optional(),
  mediaType: artifactMediaTypeSchema,
  modelFormat: modelFormatSchema.nullable().optional(),
  lightingPreset: lightingPresetSchema.nullable().optional(),
  lightTemperature: lightTemperatureSchema.nullable().optional(),
  lightDirection: lightDirectionSchema.nullable().optional(),
  metadata: z.record(z.string(), z.json()).default({}),
  translations: translationsSchema,
});

export const uploadSchema = uploadBaseSchema.superRefine((input, context) => {
  const legacyType = input.metadata.type;
  if (
    (input.mediaType === "MODEL_3D" && legacyType !== "3d-model" && legacyType !== "image-to-3d") ||
    (input.mediaType === "VIDEO" && legacyType !== "video-scan") ||
    input.mediaType === "IMAGE"
  ) {
    context.addIssue({
      code: "custom",
      path: ["metadata", "type"],
      message: "Upload type must be a 3D model, image-generated model, or video scan",
    });
  }
  const mediaUrlResult = input.mediaType === "MODEL_3D"
    ? modelUrlSchema.safeParse(input.fileUrl)
    : videoUrlSchema.safeParse(input.fileUrl);
  if (!mediaUrlResult.success) {
    context.addIssue({
      code: "custom",
      path: ["fileUrl"],
      message: mediaUrlResult.error.issues[0]?.message ?? "Unsupported media URL",
    });
  }
  if (input.mediaType === "MODEL_3D" && !input.modelFormat) {
    context.addIssue({
      code: "custom",
      path: ["modelFormat"],
      message: "Model format is required for 3D model uploads",
    });
  }
  if (
    input.mediaType === "MODEL_3D" &&
    input.modelFormat &&
    !input.fileUrl.toLowerCase().split(/[?#]/)[0].endsWith(`.${input.modelFormat}`)
  ) {
    context.addIssue({
      code: "custom",
      path: ["modelFormat"],
      message: "Model format must match the uploaded file extension",
    });
  }
  if (input.mediaType === "VIDEO" && input.modelFormat) {
    context.addIssue({
      code: "custom",
      path: ["modelFormat"],
      message: "Video uploads cannot include a model format",
    });
  }
  if (input.mediaType === "MODEL_3D" && (!input.lightTemperature || !input.lightDirection)) {
    context.addIssue({
      code: "custom",
      path: ["lightTemperature"],
      message: "Light temperature and direction are required for 3D model uploads",
    });
  }
  if (input.mediaType === "VIDEO" && (input.lightingPreset || input.lightTemperature || input.lightDirection)) {
    context.addIssue({
      code: "custom",
      path: ["lightingPreset"],
      message: "Video uploads cannot include a lighting preset",
    });
  }
  const description = input.metadata.description;
  if (typeof description !== "string" || description.trim().length < 40) {
    context.addIssue({
      code: "custom",
      path: ["metadata", "description"],
      message: "Public description must be at least 40 characters",
    });
  }
});

export const uploadIdSchema = z.object({
  id: z.string().trim().min(1),
});

export const moderationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  comment: z.string().trim().min(1).max(2_000).optional(),
}).refine(
  (input) => input.status === "APPROVED" || Boolean(input.comment),
  { path: ["comment"], message: "A curator comment is required unless approving the upload" },
);

export const uploadUpdateSchema = uploadBaseSchema
  .pick({
    title: true,
    category: true,
    fileUrl: true,
    thumbnailUrl: true,
    mediaType: true,
    modelFormat: true,
    lightingPreset: true,
    lightTemperature: true,
    lightDirection: true,
    metadata: true,
  })
  .partial()
  .extend({
    metadata: z.record(z.string(), z.json()).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "Provide a field to update");

export type UploadInput = z.infer<typeof uploadSchema>;
export type UploadUpdateInput = z.infer<typeof uploadUpdateSchema>;

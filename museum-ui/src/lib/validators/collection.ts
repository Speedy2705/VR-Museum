import { z } from "zod";

export const collectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).optional(),
  slug: z.string().trim().min(1).max(200),
});

export const collectionSlugSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

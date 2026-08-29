import { z } from "zod";

export const marketplaceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().trim().max(200).optional(),
});

export const marketplaceSlugSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});

export const marketplaceUpdateSchema = z
  .object({
    price: z.coerce.number().positive().max(1_000_000).optional(),
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
    status: z.enum(["ACTIVE", "SOLD", "INACTIVE"]).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "Provide a field to update");

export type MarketplaceUpdateInput = z.infer<typeof marketplaceUpdateSchema>;

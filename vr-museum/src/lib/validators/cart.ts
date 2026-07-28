import { z } from "zod";

export const addCartItemSchema = z.object({
  listingId: z.string().trim().min(1),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

export const removeCartItemSchema = z.object({
  itemId: z.string().trim().min(1),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

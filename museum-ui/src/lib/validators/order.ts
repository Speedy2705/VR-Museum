import { z } from "zod";

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["card", "upi"]),
}).strict();

export const orderIdSchema = z.object({
  id: z.string().trim().min(1),
});

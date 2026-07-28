import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const userRoles = [
  { value: "ARTIST", label: "Artist" },
  { value: "CURATOR", label: "Curator" },
  { value: "ARCHAEOLOGIST", label: "Archaeologist" },
  { value: "RESEARCHER", label: "Researcher" },
  { value: "VISITOR", label: "Visitor" },
] as const;

export const userRoleSchema = z.enum([
  "ARTIST",
  "CURATOR",
  "ARCHAEOLOGIST",
  "RESEARCHER",
  "VISITOR",
]);
export const completeProfileSchema = z.object({ role: userRoleSchema });

const requiredCheckoutText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max);

export const billingProfileSchema = z.object({
  name: requiredCheckoutText("Full name"),
  email: emailSchema,
  phone: z.string().trim()
    .min(7, "Enter a valid phone number")
    .max(30, "Phone number is too long")
    .regex(/^[+()\d\s.-]+$/, "Enter a valid phone number"),
  addressLine1: requiredCheckoutText("Address line 1", 200),
  addressLine2: z.string().trim().max(200).default(""),
  city: requiredCheckoutText("City"),
  state: requiredCheckoutText("State"),
  postalCode: requiredCheckoutText("Postal code", 30),
  country: requiredCheckoutText("Country"),
});

export const registerSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .min(1, "Enter your full name")
    .max(120, "Name must be at most 120 characters"),
  password: passwordSchema,
  role: userRoleSchema,
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type BillingProfileInput = z.infer<typeof billingProfileSchema>;

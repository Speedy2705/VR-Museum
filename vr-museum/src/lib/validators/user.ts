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

export const phoneSchema = z
  .string()
  .trim()
  .transform((phone) => phone.replace(/[\s().-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, "Enter a valid international number including country code"),
  );

export const credentialsSchema = z.object({
  identifier: z.union([emailSchema, phoneSchema]),
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
  phone: phoneSchema,
  addressLine1: requiredCheckoutText("Address line 1", 200),
  addressLine2: z.string().trim().max(200).default(""),
  city: requiredCheckoutText("City"),
  state: requiredCheckoutText("State"),
  postalCode: requiredCheckoutText("Postal code", 30),
  country: requiredCheckoutText("Country"),
});

export const registerSchema = z.object({
  email: z.union([emailSchema, z.literal("")]).optional(),
  phone: z.union([phoneSchema, z.literal("")]).optional(),
  name: z
    .string()
    .trim()
    .min(1, "Enter your full name")
    .max(120, "Name must be at most 120 characters"),
  password: passwordSchema,
  role: userRoleSchema,
}).superRefine((value, context) => {
  if (!value.email && !value.phone) {
    context.addIssue({
      code: "custom",
      path: ["email"],
      message: "Enter an email address or mobile number",
    });
  }
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type BillingProfileInput = z.infer<typeof billingProfileSchema>;

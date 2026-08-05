import { describe, expect, it } from "vitest";

import {
  addCartItemSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "./cart";
import { checkoutSchema, orderIdSchema } from "./order";
import {
  credentialsSchema,
  billingProfileSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
  registerSchema,
} from "./user";
import { marketplaceQuerySchema, marketplaceUpdateSchema } from "./marketplace";
import { artifactListQuerySchema, artifactSchema } from "./artifact";
import { collectionSchema } from "./collection";
import { moderationSchema, uploadSchema, uploadUpdateSchema } from "./upload";
import { locales } from "@/lib/i18n";

const translations = Object.fromEntries(locales.map((locale) => [locale, {
  title: `Artifact ${locale}`,
  description: `A complete localized artifact description for curator review in the ${locale} language.`,
  origin: `Origin ${locale}`,
  material: `Material ${locale}`,
}]));

describe("user validators", () => {
  it("requires complete, valid checkout profile details", () => {
    const valid = {
      name: "Ada Lovelace",
      email: "ADA@EXAMPLE.COM",
      phone: "+91 98765 43210",
      addressLine1: "1 Museum Road",
      addressLine2: "",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India",
    };
    expect(billingProfileSchema.parse(valid).email).toBe("ada@example.com");
    expect(billingProfileSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
    expect(billingProfileSchema.safeParse({ ...valid, city: "" }).success).toBe(false);
  });

  it("normalizes email and trims registration names", () => {
    expect(emailSchema.parse("  CURATOR@EXAMPLE.COM ")).toBe(
      "curator@example.com",
    );
    expect(
      registerSchema.parse({
        email: "USER@EXAMPLE.COM",
        name: "  Ada Lovelace  ",
        password: "museum-pass",
        role: "CURATOR",
      }),
    ).toMatchObject({ email: "user@example.com", name: "Ada Lovelace", role: "CURATOR" });
    expect(
      registerSchema.safeParse({
        email: "user@example.com",
        name: "Ada",
        password: "museum-pass",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });

  it("rejects malformed credentials and unsafe password lengths", () => {
    expect(
      credentialsSchema.safeParse({ identifier: "bad", password: "short" }).success,
    ).toBe(false);
    expect(passwordSchema.safeParse("x".repeat(129)).success).toBe(false);
    expect(phoneSchema.parse("+91 98765-43210")).toBe("+919876543210");
    expect(phoneSchema.safeParse("9876543210").success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ada", email: "", phone: "", password: "museum-pass", role: "VISITOR" }).success).toBe(false);
  });
});

describe("cart and order validators", () => {
  it("defaults add-to-cart quantity and enforces positive integers", () => {
    expect(addCartItemSchema.parse({ listingId: " listing-1 " })).toEqual({
      listingId: "listing-1",
      quantity: 1,
    });
    expect(
      addCartItemSchema.safeParse({ listingId: "listing-1", quantity: 0 })
        .success,
    ).toBe(false);
    expect(
      updateCartItemSchema.safeParse({ itemId: "item-1", quantity: 1.5 })
        .success,
    ).toBe(false);
    expect(removeCartItemSchema.parse({ itemId: " item-1 " }).itemId).toBe(
      "item-1",
    );
  });

  it("accepts a supported payment method and a non-empty order id", () => {
    expect(checkoutSchema.safeParse({ paymentMethod: "card" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ paymentMethod: "upi" }).success).toBe(true);
    expect(checkoutSchema.safeParse({}).success).toBe(false);
    expect(checkoutSchema.safeParse({ total: 1 }).success).toBe(false);
    expect(orderIdSchema.safeParse({ id: " " }).success).toBe(false);
  });
});

describe("catalog and upload validators", () => {
  it("coerces marketplace pagination and validates updates", () => {
    expect(marketplaceQuerySchema.parse({ page: "2", limit: "24" })).toEqual({
      page: 2,
      limit: 24,
    });
    expect(marketplaceUpdateSchema.parse({ currency: "gbp" }).currency).toBe(
      "GBP",
    );
    expect(marketplaceUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("applies catalog and upload bounds", () => {
    expect(
      artifactSchema.safeParse({
        title: "Vase",
        collectionId: "collection-1",
      }).success,
    ).toBe(true);
    expect(
      artifactListQuerySchema.safeParse({ query: "x".repeat(201) }).success,
    ).toBe(false);
    expect(
      collectionSchema.safeParse({
        title: "Bronze",
        slug: "bronze",
        description: "A collection",
      }).success,
    ).toBe(true);
    const upload = uploadSchema.parse({
      title: "Scan",
      category: "echoes-in-stone",
      fileUrl: "/uploads/scan.glb",
      mediaType: "MODEL_3D",
      modelFormat: "glb",
      lightingPreset: "raking-light",
      lightTemperature: "artificial-daylight",
      lightDirection: "raking-light",
      metadata: {
        type: "3d-model",
        description: "A detailed public description long enough for moderation review.",
      },
      translations,
    });
    expect(upload.metadata).toMatchObject({ description: expect.any(String) });
    expect(uploadUpdateSchema.safeParse({}).success).toBe(false);
    expect(
      moderationSchema.safeParse({ status: "CHANGES_REQUESTED" }).success,
    ).toBe(false);
    expect(
      moderationSchema.safeParse({
        status: "CHANGES_REQUESTED",
        comment: "Please improve the artifact lighting.",
      }).success,
    ).toBe(true);
  });
});

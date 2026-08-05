import { hash } from "bcryptjs";

import type { BillingProfileInput, RegisterInput } from "@/lib/validators/user";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";

export async function registerUser(input: RegisterInput) {
  const email = input.email || null;
  const phone = input.phone || null;
  if (email && await prisma.user.findUnique({ where: { email } })) {
    throw new ServiceError(
      "An account with this email already exists",
      "EMAIL_TAKEN",
      409,
    );
  }
  if (phone && await prisma.user.findUnique({ where: { phone } })) {
    throw new ServiceError(
      "An account with this mobile number already exists",
      "PHONE_TAKEN",
      409,
    );
  }

  // Hash before constructing the Prisma payload so the plaintext password is
  // never stored, returned, or passed to application logging.
  const passwordHash = await hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      name: input.name,
      passwordHash,
      role: input.role,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
  return user;
}

export async function completeUserProfile(userId: string, role: RegisterInput["role"]) {
  const result = await prisma.user.updateMany({
    where: { id: userId, role: null },
    data: { role },
  });
  if (result.count !== 1) {
    throw new ServiceError(
      "Profile role has already been completed",
      "ROLE_ALREADY_SET",
      409,
    );
  }
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
}

const billingProfileSelect = {
  name: true,
  email: true,
  phone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
} as const;

export function getBillingProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: billingProfileSelect,
  });
}

export function updateBillingProfile(userId: string, input: BillingProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      addressLine2: input.addressLine2 || null,
    },
    select: billingProfileSelect,
  });
}

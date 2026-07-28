import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import { ensureCommunityListing } from "@/server/services/upload.service";

const cartInclude = {
  listing: {
    include: {
      artifact: true,
      seller: { select: { id: true, name: true } },
    },
  },
} as const;

export type PricedCartItem = {
  quantity: number;
  price: number | string | { toString(): string };
};

export function calculateCartSubtotal(items: PricedCartItem[]) {
  const cents = items.reduce(
    (sum, item) => sum + Math.round(Number(item.price) * 100) * item.quantity,
    0,
  );
  return cents / 100;
}

export function getCart(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: cartInclude,
    orderBy: { addedAt: "desc" },
  });
}

export async function addCartItem(
  userId: string,
  input: { listingId: string; quantity: number },
) {
  let listing = await prisma.marketplaceListing.findUnique({
    where: { id: input.listingId },
    include: { artifact: true },
  });
  if (!listing && input.listingId.startsWith("community-listing-")) {
    const uploadId = input.listingId.slice("community-listing-".length);
    await ensureCommunityListing(uploadId);
    listing = await prisma.marketplaceListing.findUnique({
      where: { id: input.listingId },
      include: { artifact: true },
    });
  }
  if (!listing || listing.status !== "ACTIVE" || !listing.artifact.isForSale) {
    throw new ServiceError(
      "Listing is not available",
      "LISTING_UNAVAILABLE",
      409,
    );
  }
  return prisma.cartItem.upsert({
    where: { userId_listingId: { userId, listingId: input.listingId } },
    update: { quantity: { increment: input.quantity } },
    create: { userId, listingId: input.listingId, quantity: input.quantity },
    include: cartInclude,
  });
}

export async function updateCartItem(
  userId: string,
  input: { itemId: string; quantity: number },
) {
  const item = await prisma.cartItem.findFirst({
    where: { id: input.itemId, userId },
  });
  if (!item) throw new ServiceError("Cart item not found", "NOT_FOUND", 404);
  return prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: input.quantity },
    include: cartInclude,
  });
}

export async function removeCartItem(userId: string, itemId: string) {
  const result = await prisma.cartItem.deleteMany({
    where: { id: itemId, userId },
  });
  if (!result.count) {
    throw new ServiceError("Cart item not found", "NOT_FOUND", 404);
  }
  return { id: itemId };
}

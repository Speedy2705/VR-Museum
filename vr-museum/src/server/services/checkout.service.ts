import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import { calculateCartSubtotal } from "@/server/services/cart.service";

export const SERVICE_FEE_RATE = 0.05;

export function calculateCheckout(
  items: {
    quantity: number;
    price: number | string | { toString(): string };
  }[],
) {
  const subtotal = calculateCartSubtotal(items);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  return { subtotal, serviceFee, total: subtotal + serviceFee };
}

export async function createPendingOrder(
  userId: string,
  paymentMethod: "CARD" | "UPI",
) {
  return prisma.$transaction(async (transaction) => {
    const cart = await transaction.cartItem.findMany({
      where: { userId },
      include: { listing: { include: { artifact: true } } },
    });
    if (!cart.length) {
      throw new ServiceError("Cart is empty", "EMPTY_CART", 409);
    }

    const unavailable = cart.find(
      ({ listing }) =>
        listing.status !== "ACTIVE" || !listing.artifact.isForSale,
    );
    if (unavailable) {
      throw new ServiceError(
        "A cart listing is no longer available",
        "LISTING_UNAVAILABLE",
        409,
        { listingId: unavailable.listingId },
      );
    }

    const { total } = calculateCheckout(
      cart.map((item) => ({
        price: item.listing.price,
        quantity: item.quantity,
      })),
    );
    const order = await transaction.order.create({
      data: {
        userId,
        total,
        status: "PENDING",
        paymentMethod,
        paymentStatus: "PENDING",
        items: {
          create: cart.map((item) => ({
            listingId: item.listingId,
            quantity: item.quantity,
            price: item.listing.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            listing: { include: { artifact: true } },
          },
        },
      },
    });

    return order;
  });
}

export async function finalizePaidOrder(
  orderId: string,
  paymentProviderId: string,
) {
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "PAID" } },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        paymentProviderId,
      },
    });
    if (updated.count === 0) {
      const existing = await transaction.order.findUnique({ where: { id: orderId } });
      if (!existing) throw new ServiceError("Order not found", "NOT_FOUND", 404);
      return { order: existing, fulfilled: false };
    }

    const order = await transaction.order.findUniqueOrThrow({ where: { id: orderId } });
    await transaction.cartItem.deleteMany({ where: { userId: order.userId } });
    return { order, fulfilled: true };
  });
}

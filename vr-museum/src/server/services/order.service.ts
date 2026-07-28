import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";

const orderInclude = {
  items: {
    include: {
      listing: {
        include: {
          artifact: true,
          seller: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

export function listOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(userId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: orderInclude,
  });
  if (!order) throw new ServiceError("Order not found", "NOT_FOUND", 404);
  return order;
}

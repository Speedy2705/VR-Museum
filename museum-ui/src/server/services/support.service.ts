import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";

export function createSupportRequest(userId: string, input: { type: "QUERY" | "FEEDBACK"; subject: string; message: string }) {
  return prisma.supportRequest.create({ data: { requesterId: userId, ...input } });
}

export function listUserSupportRequests(userId: string) {
  return prisma.supportRequest.findMany({ where: { requesterId: userId }, include: { respondedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
}

export function listOpenSupportRequests() {
  return prisma.supportRequest.findMany({ where: { status: "OPEN" }, include: { requester: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } });
}

export async function answerSupportRequest(id: string, curatorId: string, response: string) {
  const request = await prisma.supportRequest.findUnique({ where: { id }, select: { status: true } });
  if (!request || request.status !== "OPEN") throw new ServiceError("Open request not found", "NOT_FOUND", 404);
  return prisma.supportRequest.update({ where: { id }, data: { response, status: "ANSWERED", respondedAt: new Date(), respondedById: curatorId } });
}

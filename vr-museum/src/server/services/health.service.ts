import { prisma } from "@/lib/prisma";

export async function getHealthStatus() {
  await prisma.$queryRaw`SELECT 1`;

  return {
    database: "connected",
    status: "ok",
  } as const;
}

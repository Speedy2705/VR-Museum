import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";

export function listArtifacts(filters: {
  collection?: string;
  preset?: string;
  query?: string;
}) {
  const where: Prisma.ArtifactWhereInput = {};
  if (filters.collection) {
    where.collection = { slug: filters.collection };
  }
  if (filters.preset) {
    where.preset = { equals: filters.preset };
  }
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query } },
      { subtitle: { contains: filters.query } },
      { description: { contains: filters.query } },
      { collection: { title: { contains: filters.query } } },
    ];
  }
  return prisma.artifact.findMany({
    where,
    orderBy: { title: "asc" },
    include: { collection: true },
  });
}

export async function getArtifact(slug: string) {
  const artifact = await prisma.artifact.findUnique({
    where: { slug },
    include: {
      collection: true,
      listings: {
        where: { status: "ACTIVE" },
        include: { seller: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!artifact) {
    throw new ServiceError("Artifact not found", "NOT_FOUND", 404);
  }
  return artifact;
}

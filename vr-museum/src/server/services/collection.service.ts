import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";

export function listCollections() {
  return prisma.collection.findMany({
    orderBy: { title: "asc" },
    include: {
      _count: { select: { artifacts: true } },
      artifacts: {
        orderBy: { title: "asc" },
        take: 1,
        select: {
          videoUrl: true,
          modelUrl: true,
          modelFormat: true,
          primaryMediaType: true,
        },
      },
    },
  });
}

export async function listPublicCollections() {
  const [collections, approvedCount, latest] = await Promise.all([
    listCollections(),
    prisma.uploadedAsset.count({ where: { status: "APPROVED" } }),
    prisma.uploadedAsset.findFirst({
      where: { status: "APPROVED", thumbnailUrl: { not: null } },
      orderBy: { id: "desc" },
      select: {
        thumbnailUrl: true,
        fileUrl: true,
        mediaType: true,
        modelFormat: true,
      },
    }),
  ]);
  return [
    ...collections.filter((collection) => collection.slug !== "community-uploads").map((collection) => ({
      ...collection,
      source: "museum" as const,
      count: collection._count.artifacts,
      video: collection.artifacts[0]?.videoUrl ?? undefined,
      model:
        collection.artifacts[0]?.modelUrl &&
        (collection.artifacts[0].modelFormat === "glb" ||
          collection.artifacts[0].modelFormat === "gltf" ||
          collection.artifacts[0].modelFormat === "obj" ||
          collection.artifacts[0].modelFormat === "stl")
          ? {
              url: collection.artifacts[0].modelUrl,
              format: collection.artifacts[0].modelFormat as
                | "glb"
                | "gltf"
                | "obj"
                | "stl",
            }
          : undefined,
      primaryMediaType:
        collection.artifacts[0]?.primaryMediaType === "MODEL_3D"
          ? "model" as const
          : collection.artifacts[0]?.primaryMediaType?.toLowerCase() as
              | "image"
              | "video"
              | undefined,
    })),
    {
      id: "community-uploads",
      slug: "community-uploads",
      title: "Community Uploads",
      subtitle: "Approved contributions",
      description: "Public 3D artifacts contributed by museum community creators and reviewed by curators.",
      heroImage: latest?.thumbnailUrl ?? "/images/gallery-wall.png",
      category: "Community",
      source: "community" as const,
      count: approvedCount,
      video: latest?.mediaType === "VIDEO" ? latest.fileUrl : undefined,
      model:
        latest?.mediaType === "MODEL_3D" &&
        (latest.modelFormat === "glb" ||
          latest.modelFormat === "gltf" ||
          latest.modelFormat === "obj" ||
          latest.modelFormat === "stl")
          ? {
              url: latest.fileUrl,
              format: latest.modelFormat as "glb" | "gltf" | "obj" | "stl",
            }
          : undefined,
      primaryMediaType:
        latest?.mediaType === "MODEL_3D"
          ? "model" as const
          : latest?.mediaType?.toLowerCase() as "image" | "video" | undefined,
      _count: { artifacts: approvedCount },
    },
  ];
}

export async function getCommunityCollection(page = 1, limit = 12) {
  const where = { status: "APPROVED" as const };
  const [artifacts, total] = await prisma.$transaction([
    prisma.uploadedAsset.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { title: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.uploadedAsset.count({ where }),
  ]);
  return {
    id: "community-uploads",
    slug: "community-uploads",
    title: "Community Uploads",
    subtitle: "Curator-approved creator contributions",
    description: "Approved public contributions from artists, researchers, and archaeologists in the museum community.",
    heroImage: artifacts.find((item) => item.thumbnailUrl)?.thumbnailUrl ?? "/images/gallery-wall.png",
    category: "Community",
    artifacts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getCollection(slug: string) {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: { artifacts: { orderBy: { title: "asc" } } },
  });
  if (!collection) {
    throw new ServiceError("Collection not found", "NOT_FOUND", 404);
  }
  return collection;
}

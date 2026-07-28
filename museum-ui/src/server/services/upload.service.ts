import { Prisma } from "@/generated/prisma/client";
import type { UploadInput, UploadUpdateInput } from "@/lib/validators/upload";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";

const COMMUNITY_COLLECTION_ID = "community-uploads";
export const communityArtifactId = (id: string) => `community-artifact-${id}`;
export const communityListingId = (id: string) => `community-listing-${id}`;
export const communityArtifactSlug = (id: string) => `community-upload-${id}`;

type UploadForListing = {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | "MODEL_3D";
  modelFormat: string | null;
  metadata: unknown;
};

async function createCommunityListing(
  transaction: Prisma.TransactionClient,
  upload: UploadForListing,
) {
  const metadata = upload.metadata && typeof upload.metadata === "object"
    ? upload.metadata as Record<string, unknown>
    : {};
  const price = typeof metadata.price === "number" && metadata.price > 0
    ? metadata.price
    : 0;
  const origin = String(metadata.period ?? metadata.origin ?? "Community upload");

  const collection = await transaction.collection.upsert({
    where: { slug: "community-uploads" },
    update: {},
    create: {
      id: COMMUNITY_COLLECTION_ID,
      slug: "community-uploads",
      title: "Community Uploads",
      subtitle: "Curator-approved community artifacts",
      description: "Artifacts uploaded by community creators and approved for the marketplace.",
      heroImage: upload.thumbnailUrl ?? "",
      category: "Community",
    },
  });
  await transaction.artifact.upsert({
    where: { id: communityArtifactId(upload.id) },
    update: {
      title: upload.title,
      subtitle: `${origin} · ${upload.category}`,
      preset: String(metadata.lighting ?? "Studio"),
      image: upload.thumbnailUrl ?? "",
      videoUrl: upload.mediaType === "VIDEO" ? upload.fileUrl : null,
      modelUrl: upload.mediaType === "MODEL_3D" ? upload.fileUrl : null,
      modelFormat: upload.modelFormat,
      primaryMediaType: upload.mediaType,
      description: String(metadata.description ?? "A curator-approved community artifact."),
      collectionId: collection.id,
      price: price > 0 ? price : null,
      isForSale: true,
    },
    create: {
      id: communityArtifactId(upload.id),
      slug: communityArtifactSlug(upload.id),
      title: upload.title,
      subtitle: `${origin} · ${upload.category}`,
      preset: String(metadata.lighting ?? "Studio"),
      image: upload.thumbnailUrl ?? "",
      videoUrl: upload.mediaType === "VIDEO" ? upload.fileUrl : null,
      modelUrl: upload.mediaType === "MODEL_3D" ? upload.fileUrl : null,
      modelFormat: upload.modelFormat,
      primaryMediaType: upload.mediaType,
      description: String(metadata.description ?? "A curator-approved community artifact."),
      collectionId: collection.id,
      price: price > 0 ? price : null,
      isForSale: true,
    },
  });
  return transaction.marketplaceListing.upsert({
    where: { id: communityListingId(upload.id) },
    update: { price, status: "ACTIVE" },
    create: {
      id: communityListingId(upload.id),
      artifactId: communityArtifactId(upload.id),
      sellerId: upload.ownerId,
      price,
      status: "ACTIVE",
    },
  });
}

/** Backfills a listing for approved uploads created before marketplace billing was enabled. */
export async function ensureCommunityListing(uploadId: string) {
  const upload = await prisma.uploadedAsset.findFirst({
    where: { id: uploadId, status: "APPROVED" },
  });
  if (!upload) return null;
  return prisma.$transaction((transaction) => createCommunityListing(transaction, upload));
}

export function createUpload(userId: string, input: UploadInput) {
  return prisma.uploadedAsset.create({
    data: {
      ownerId: userId,
      title: input.title,
      category: input.category,
      fileUrl: input.fileUrl,
      thumbnailUrl: input.thumbnailUrl,
      mediaType: input.mediaType,
      modelFormat: input.modelFormat,
      metadata: input.metadata as Prisma.InputJsonObject,
      status: "PENDING",
    },
  });
}

export async function listUploads(userId: string) {
  const uploads = await prisma.uploadedAsset.findMany({
    where: { ownerId: userId },
    orderBy: { id: "desc" },
  });
  const paidItems = await prisma.orderItem.findMany({
    where: {
      listingId: { in: uploads.map((upload) => communityListingId(upload.id)) },
      order: { paymentStatus: "PAID" },
    },
    select: { listingId: true, price: true, quantity: true },
  });
  const earnings = new Map<string, number>();
  for (const item of paidItems) {
    earnings.set(
      item.listingId,
      (earnings.get(item.listingId) ?? 0) + Number(item.price) * item.quantity,
    );
  }
  return uploads.map((upload) => ({
    ...upload,
    earnings: earnings.get(communityListingId(upload.id)) ?? 0,
  }));
}

export async function recordUploadView(id: string) {
  return prisma.uploadedAsset.updateMany({
    where: { id, status: "APPROVED" },
    data: { views: { increment: 1 } },
  });
}

export function listPendingUploads() {
  return prisma.uploadedAsset.findMany({
    where: { status: "PENDING" },
    include: { owner: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { id: "asc" },
  });
}

export async function moderateUpload(id: string, status: "APPROVED" | "REJECTED") {
  const upload = await prisma.uploadedAsset.findUnique({
    where: { id },
  });
  if (!upload) throw new ServiceError("Upload not found", "NOT_FOUND", 404);
  if (upload.status !== "PENDING") {
    throw new ServiceError(
      "This upload has already been moderated",
      "ALREADY_MODERATED",
      409,
    );
  }
  return prisma.$transaction(async (transaction) => {
    const moderated = await transaction.uploadedAsset.update({
      where: { id },
      data: { status },
      include: { owner: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (status === "APPROVED") await createCommunityListing(transaction, upload);
    return moderated;
  });
}

export async function getUpload(userId: string, id: string) {
  const upload = await prisma.uploadedAsset.findFirst({
    where: { id, ownerId: userId },
  });
  if (!upload) throw new ServiceError("Upload not found", "NOT_FOUND", 404);
  return upload;
}

export async function updateUpload(
  userId: string,
  id: string,
  input: UploadUpdateInput,
) {
  const existing = await getUpload(userId, id);
  const existingMetadata = existing.metadata && typeof existing.metadata === "object"
    ? existing.metadata as Record<string, Prisma.JsonValue>
    : {};
  const metadata = input.metadata
    ? { ...existingMetadata, ...input.metadata }
    : existingMetadata;

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.uploadedAsset.update({
      where: { id },
      data: {
        ...input,
        metadata: metadata as Prisma.InputJsonObject,
        ...(existing.status === "REJECTED" ? { status: "PENDING" as const } : {}),
      },
    });
    if (updated.status === "APPROVED") {
      await createCommunityListing(transaction, updated);
    }
    return updated;
  });
}

export async function deleteUpload(userId: string, id: string) {
  await getUpload(userId, id);
  await prisma.uploadedAsset.delete({ where: { id } });
  return { id };
}

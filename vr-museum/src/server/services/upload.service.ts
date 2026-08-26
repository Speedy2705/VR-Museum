import { Prisma } from "@/generated/prisma/client";
import type { UploadInput, UploadUpdateInput } from "@/lib/validators/upload";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import { getCategoryByKey, type CollectionSlug } from "@/lib/artifact-categories";
import { fileStorage } from "@/server/storage";

const COMMUNITY_COLLECTION_ID = "community-uploads";
export const communityArtifactId = (id: string) => `community-artifact-${id}`;
export const communityListingId = (id: string) => `community-listing-${id}`;
export const communityArtifactSlug = (id: string) => `community-upload-${id}`;

export function storedMediaUrls(upload: { fileUrl: string; thumbnailUrl: string | null }) {
  return [upload.fileUrl, upload.thumbnailUrl].filter((url): url is string => Boolean(url));
}

export async function deleteStoredMedia(urls: string[]) {
  if (!urls.length) return;
  try {
    await fileStorage.delete(urls);
  } catch (error) {
    // The database remains authoritative. The scheduled orphan sweep retries
    // files that could not be removed during the request lifecycle.
    console.error("Unable to delete stored upload media", { urls, error });
  }
}

type UploadForListing = {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | "MODEL_3D";
  modelFormat: string | null;
  lightingPreset: string | null;
  lightTemperature: string | null;
  lightDirection: string | null;
  collectionSlug: string | null;
  metadata: unknown;
  translations: unknown;
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

  const collectionSlug = (upload.collectionSlug ?? "community-uploads") as CollectionSlug;
  const category = getCategoryByKey(collectionSlug) ?? getCategoryByKey("community-uploads")!;
  const collection = collectionSlug === "community-uploads"
    ? await transaction.collection.upsert({
        where: { slug: "community-uploads" },
        update: {},
        create: {
          id: COMMUNITY_COLLECTION_ID,
          slug: "community-uploads",
          title: category.name,
          subtitle: "Curator-approved community artifacts",
          description: "Artifacts uploaded by community creators and approved for the marketplace.",
          heroImage: upload.thumbnailUrl ?? "",
          category: "Community",
        },
      })
    : await transaction.collection.findUnique({ where: { slug: collectionSlug } });
  if (!collection) {
    throw new ServiceError(`Collection ${category.name} was not found`, "COLLECTION_NOT_FOUND", 500);
  }
  const presetNames: Record<string, string> = {
    "warm-diffuse": "Warm Diffuse",
    "directional-spot": "Directional Spot",
    "cool-ambient": "Cool Ambient",
    "backlit-halo": "Backlit Halo",
    "raking-light": "Raking Light",
  };
  const preset = upload.lightingPreset
    ? presetNames[upload.lightingPreset] ?? upload.lightingPreset
    : "Studio Recorded";
  await transaction.artifact.upsert({
    where: { id: communityArtifactId(upload.id) },
    update: {
      title: upload.title,
      subtitle: `${origin} · ${upload.category}`,
      preset,
      image: upload.thumbnailUrl ?? "",
      videoUrl: upload.mediaType === "VIDEO" ? upload.fileUrl : null,
      modelUrl: upload.mediaType === "MODEL_3D" ? upload.fileUrl : null,
      modelFormat: upload.modelFormat,
      primaryMediaType: upload.mediaType,
      description: String(metadata.description ?? "A curator-approved community artifact."),
      translations: upload.translations as Prisma.InputJsonValue,
      collectionId: collection.id,
      price: price > 0 ? price : null,
      isForSale: true,
    },
    create: {
      id: communityArtifactId(upload.id),
      slug: communityArtifactSlug(upload.id),
      title: upload.title,
      subtitle: `${origin} · ${upload.category}`,
      preset,
      image: upload.thumbnailUrl ?? "",
      videoUrl: upload.mediaType === "VIDEO" ? upload.fileUrl : null,
      modelUrl: upload.mediaType === "MODEL_3D" ? upload.fileUrl : null,
      modelFormat: upload.modelFormat,
      primaryMediaType: upload.mediaType,
      description: String(metadata.description ?? "A curator-approved community artifact."),
      translations: upload.translations as Prisma.InputJsonValue,
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
      lightingPreset: input.lightingPreset,
      lightTemperature: input.lightTemperature,
      lightDirection: input.lightDirection,
      collectionSlug: input.category,
      metadata: input.metadata as Prisma.InputJsonObject,
      translations: input.translations as Prisma.InputJsonObject,
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

export async function moderateUpload(
  id: string,
  status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
  comment: string | undefined,
  curatorId: string,
) {
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
      data: {
        status,
        curatorId,
        reviewedAt: new Date(),
        curatorComment: status === "APPROVED" ? null : comment,
      },
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
  if (existing.status === "REJECTED") {
    throw new ServiceError(
      "This upload was rejected and can no longer be edited",
      "UPLOAD_REJECTED_TERMINAL",
      409,
    );
  }
  const existingMetadata = existing.metadata && typeof existing.metadata === "object"
    ? existing.metadata as Record<string, Prisma.JsonValue>
    : {};
  const metadata = input.metadata
    ? { ...existingMetadata, ...input.metadata }
    : existingMetadata;

  const updated = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.uploadedAsset.update({
      where: { id },
      data: {
        ...input,
        ...(input.category ? { collectionSlug: input.category } : {}),
        metadata: metadata as Prisma.InputJsonObject,
        ...(existing.status === "CHANGES_REQUESTED"
          ? { status: "PENDING" as const, curatorComment: null }
          : {}),
      },
    });
    if (updated.status === "APPROVED") {
      await createCommunityListing(transaction, updated);
    }
    return updated;
  });
  const replacedUrls = [
    input.fileUrl && input.fileUrl !== existing.fileUrl ? existing.fileUrl : null,
    input.thumbnailUrl && input.thumbnailUrl !== existing.thumbnailUrl ? existing.thumbnailUrl : null,
  ].filter((url): url is string => Boolean(url));
  await deleteStoredMedia(replacedUrls);
  return updated;
}

export async function deleteUpload(userId: string, id: string) {
  const upload = await getUpload(userId, id);
  await prisma.uploadedAsset.delete({ where: { id } });
  await deleteStoredMedia(storedMediaUrls(upload));
  return { id };
}

import { list, type ListBlobResultBlob } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { deleteStoredMedia, storedMediaUrls } from "@/server/services/upload.service";
import { fileStorage } from "@/server/storage";
import { listB2UploadObjects } from "@/server/storage/b2";

const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;
const REJECTED_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

function blobOptions() {
  return process.env.BLOB_READ_WRITE_TOKEN_STORE_ID
    ? { storeId: process.env.BLOB_READ_WRITE_TOKEN_STORE_ID }
    : {};
}

async function listUploadBlobs() {
  if (process.env.STORAGE_PROVIDER === "backblaze-b2") return listB2UploadObjects();
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "uploads/", cursor, limit: 1000, ...blobOptions() });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function referencedMediaUrls() {
  const [uploads, artifacts, collections, meshySources] = await Promise.all([
    prisma.uploadedAsset.findMany({ select: { fileUrl: true, thumbnailUrl: true } }),
    prisma.artifact.findMany({ select: { image: true, videoUrl: true, modelUrl: true } }),
    prisma.collection.findMany({ select: { heroImage: true } }),
    prisma.meshySourceUpload.findMany({
      where: { cleanedAt: null },
      select: { blobUrls: true },
    }),
  ]);
  return new Set([
    ...uploads.flatMap(storedMediaUrls),
    ...artifacts.flatMap((artifact) => [artifact.image, artifact.videoUrl, artifact.modelUrl]),
    ...collections.map((collection) => collection.heroImage),
    ...meshySources.flatMap((source) => source.blobUrls),
  ].filter((url): url is string => Boolean(url)));
}

async function deleteBlobBatches(urls: string[]) {
  for (let index = 0; index < urls.length; index += 100) {
    await fileStorage.delete(urls.slice(index, index + 100));
  }
}

export async function cleanupUploadStorage(options: { dryRun: boolean; now?: Date }) {
  const now = options.now ?? new Date();
  const rejectedCutoff = new Date(now.getTime() - REJECTED_AFTER_MS);
  const abandonedCutoff = new Date(now.getTime() - ABANDONED_AFTER_MS);

  const rejected = await prisma.uploadedAsset.findMany({
    where: { status: "REJECTED", reviewedAt: { lt: rejectedCutoff } },
    select: { id: true, fileUrl: true, thumbnailUrl: true },
  });
  const rejectedUrls = rejected.flatMap(storedMediaUrls);

  if (!options.dryRun && rejected.length) {
    await prisma.uploadedAsset.deleteMany({
      where: { id: { in: rejected.map((upload) => upload.id) }, status: "REJECTED" },
    });
    await deleteStoredMedia(rejectedUrls);
  }

  const referenced = await referencedMediaUrls();
  const blobs = await listUploadBlobs();
  const orphans = blobs.filter(
    (blob) => blob.uploadedAt < abandonedCutoff && !referenced.has(blob.url),
  );
  if (!options.dryRun && orphans.length) {
    await deleteBlobBatches(orphans.map((blob) => blob.url));
  }

  return {
    dryRun: options.dryRun,
    rejected: rejected.map((upload) => ({ id: upload.id, urls: storedMediaUrls(upload) })),
    abandoned: orphans.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    })),
    reclaimedBytes: [
      ...new Set([...rejectedUrls, ...orphans.map((blob) => blob.url)]),
    ].reduce((total, url) => total + (blobs.find((blob) => blob.url === url)?.size ?? 0), 0),
  };
}

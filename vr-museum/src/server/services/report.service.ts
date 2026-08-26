import { prisma } from "@/lib/prisma";
import { deleteStoredMedia, storedMediaUrls } from "@/server/services/upload.service";
import { ServiceError } from "@/lib/service-error";
import { communityArtifactId, communityListingId } from "@/server/services/upload.service";

export async function createArtifactReport(input: {
  uploadId?: string;
  artifactSlug?: string;
  reason: string;
  details?: string;
  reporterId: string;
}) {
  const upload = input.uploadId ? await prisma.uploadedAsset.findFirst({ where: { id: input.uploadId, status: "APPROVED" }, select: { id: true, title: true } }) : null;
  const artifact = input.artifactSlug ? await prisma.artifact.findUnique({ where: { slug: input.artifactSlug }, select: { title: true } }) : null;
  if (!upload && !artifact) throw new ServiceError("Artifact not found", "NOT_FOUND", 404);
  return prisma.artifactReport.create({
    data: {
      uploadId: upload?.id,
      artifactTitle: upload?.title ?? artifact!.title,
      reason: input.reason,
      details: input.details,
      reporterId: input.reporterId,
    },
  });
}

export function listOpenReports() {
  return prisma.artifactReport.findMany({
    where: { status: "OPEN" },
    include: { upload: { include: { owner: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function resolveArtifactReport(
  reportId: string,
  curatorId: string,
  action: "DISMISS" | "REMOVE",
) {
  const result = await prisma.$transaction(async (transaction) => {
    const report = await transaction.artifactReport.findUnique({ where: { id: reportId } });
    if (!report || report.status !== "OPEN") {
      throw new ServiceError("Open report not found", "NOT_FOUND", 404);
    }
    if (action === "REMOVE" && report.uploadId) {
      const upload = await transaction.uploadedAsset.findUnique({
        where: { id: report.uploadId },
        select: { fileUrl: true, thumbnailUrl: true },
      });
      const listingId = communityListingId(report.uploadId);
      await transaction.cartItem.deleteMany({ where: { listingId } });
      await transaction.marketplaceListing.updateMany({
        where: { id: listingId },
        data: { status: "INACTIVE" },
      });
      await transaction.artifact.updateMany({
        where: { id: communityArtifactId(report.uploadId) },
        data: { isForSale: false },
      });
      await transaction.artifactReport.updateMany({
        where: { uploadId: report.uploadId, status: "OPEN" },
        data: { status: "REMOVED", resolvedAt: new Date(), resolvedById: curatorId },
      });
      await transaction.uploadedAsset.delete({ where: { id: report.uploadId } });
      return { action, removed: true, mediaUrls: upload ? storedMediaUrls(upload) : [] };
    }
    await transaction.artifactReport.update({
      where: { id: report.id },
      data: { status: "DISMISSED", resolvedAt: new Date(), resolvedById: curatorId },
    });
    return { action, removed: false, mediaUrls: [] as string[] };
  });
  await deleteStoredMedia(result.mediaUrls);
  return { action: result.action, removed: result.removed };
}

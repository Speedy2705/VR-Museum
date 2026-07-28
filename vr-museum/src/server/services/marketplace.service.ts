import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import type { MarketplaceUpdateInput } from "@/lib/validators/marketplace";

const listingInclude = {
  artifact: { include: { collection: true } },
  seller: { select: { id: true, name: true, image: true, role: true } },
} satisfies Prisma.MarketplaceListingInclude;

export async function listMarketplace(input: {
  page: number;
  limit: number;
  search?: string;
}) {
  const where: Prisma.MarketplaceListingWhereInput = {
    status: "ACTIVE",
    // Community uploads have backing listings for cart/checkout, but are rendered
    // from UploadedAsset below so they retain their community detail page.
    artifact: { id: { not: { startsWith: "community-artifact-" } } },
    ...(input.search
      ? {
          OR: [
            { artifact: { title: { contains: input.search } } },
            { artifact: { description: { contains: input.search } } },
            { seller: { name: { contains: input.search } } },
          ],
        }
      : {}),
  };
  const communityWhere: Prisma.UploadedAssetWhereInput = {
    status: "APPROVED",
    ...(input.search ? {
      OR: [
        { title: { contains: input.search } },
        { category: { contains: input.search } },
        { owner: { name: { contains: input.search } } },
      ],
    } : {}),
  };
  const take = input.page * input.limit;
  const [museumItems, communityItems, museumTotal, communityTotal] = await prisma.$transaction([
    prisma.marketplaceListing.findMany({
      where,
      include: listingInclude,
      orderBy: { artifact: { title: "asc" } },
      take,
    }),
    prisma.uploadedAsset.findMany({
      where: communityWhere,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { title: "asc" },
      take,
    }),
    prisma.marketplaceListing.count({ where }),
    prisma.uploadedAsset.count({ where: communityWhere }),
  ]);
  const items = [
    ...museumItems.map((item) => ({ source: "museum" as const, item })),
    ...communityItems.map((item) => ({ source: "community" as const, item })),
  ].toSorted((a, b) => {
    const aTitle = a.source === "museum" ? a.item.artifact.title : a.item.title;
    const bTitle = b.source === "museum" ? b.item.artifact.title : b.item.title;
    return aTitle.localeCompare(bTitle);
  }).slice((input.page - 1) * input.limit, input.page * input.limit);
  const total = museumTotal + communityTotal;
  return {
    items,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function getPublicUpload(id: string) {
  const upload = await prisma.uploadedAsset.findFirst({
    where: { id, status: "APPROVED" },
    include: { owner: { select: { id: true, name: true } } },
  });
  if (!upload) throw new ServiceError("Community upload not found", "NOT_FOUND", 404);
  return upload;
}

export async function getMarketplaceListing(slug: string) {
  const listing = await prisma.marketplaceListing.findFirst({
    where: { artifact: { slug }, status: "ACTIVE" },
    include: listingInclude,
  });
  if (!listing) {
    throw new ServiceError("Marketplace listing not found", "NOT_FOUND", 404);
  }
  return listing;
}

async function getOwnedListing(userId: string, slug: string) {
  const listing = await prisma.marketplaceListing.findFirst({
    where: { sellerId: userId, artifact: { slug } },
    select: { id: true },
  });
  if (!listing) {
    throw new ServiceError("Marketplace listing not found", "NOT_FOUND", 404);
  }
  return listing;
}

export async function updateMarketplaceListing(
  userId: string,
  slug: string,
  input: MarketplaceUpdateInput,
) {
  const listing = await getOwnedListing(userId, slug);
  return prisma.marketplaceListing.update({
    where: { id: listing.id },
    data: input,
    include: listingInclude,
  });
}

export async function deleteMarketplaceListing(userId: string, slug: string) {
  const listing = await getOwnedListing(userId, slug);
  await prisma.marketplaceListing.delete({ where: { id: listing.id } });
  return { id: listing.id };
}

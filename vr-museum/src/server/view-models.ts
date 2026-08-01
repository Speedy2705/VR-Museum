import type {
  MarketplaceView,
  PurchasedAssetView,
  UploadedAssetView,
} from "@/types/catalog";
import { communityArtifactSlug, communityListingId } from "@/server/services/upload.service";

type ListingRecord = {
  id: string;
  price: unknown;
  artifact: {
    slug: string;
    title: string;
    subtitle: string;
    preset: string;
    image: string;
    videoUrl: string | null;
    modelUrl: string | null;
    modelFormat: string | null;
    primaryMediaType: "IMAGE" | "VIDEO" | "MODEL_3D";
    description: string;
    price: unknown;
  };
  seller: {
    name: string | null;
    role?: "ARTIST" | "ARCHAEOLOGIST" | "CURATOR" | "RESEARCHER" | "VISITOR" | null;
  };
};

export function toMarketplaceView(listing: ListingRecord): MarketplaceView {
  const [period = "", material = "Artifact"] =
    listing.artifact.subtitle.split(" · ");
  return {
    listingId: listing.id,
    source: "museum",
    slug: listing.artifact.slug,
    title: listing.artifact.title,
    artist: listing.seller.name ?? "Museum Contributor",
    sellerRole:
      listing.seller.role === "ARTIST" ||
      listing.seller.role === "ARCHAEOLOGIST" ||
      listing.seller.role === "CURATOR"
        ? listing.seller.role
        : null,
    material,
    period,
    lighting: listing.artifact.preset,
    license: "Digital Artifact License",
    price:
      listing.artifact.price === null ? null : Number(listing.price),
    description: listing.artifact.description,
    image: listing.artifact.image,
    video: listing.artifact.videoUrl ?? undefined,
    model:
      listing.artifact.modelUrl &&
      (listing.artifact.modelFormat === "glb" ||
        listing.artifact.modelFormat === "gltf" ||
        listing.artifact.modelFormat === "obj" ||
        listing.artifact.modelFormat === "stl")
        ? {
            url: listing.artifact.modelUrl,
            format: listing.artifact.modelFormat,
          }
        : undefined,
    primaryMediaType:
      listing.artifact.primaryMediaType === "MODEL_3D"
        ? "model"
        : listing.artifact.primaryMediaType.toLowerCase() as "image" | "video",
  };
}

export function publicUploadToMarketplaceView(upload: {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "MODEL_3D";
  modelFormat: string | null;
  metadata: unknown;
  owner: { id: string; name: string | null };
}): MarketplaceView {
  const metadata =
    upload.metadata && typeof upload.metadata === "object"
      ? upload.metadata as Record<string, unknown>
      : {};
  const rawPrice = metadata.price;
  return {
    listingId: communityListingId(upload.id),
    source: "community",
    href: `/community/${upload.id}`,
    uploaderId: upload.owner.id,
    slug: communityArtifactSlug(upload.id),
    title: upload.title,
    artist: upload.owner.name ?? "Museum community member",
    material: upload.category,
    period: String(metadata.period ?? metadata.origin ?? "Contemporary scan"),
    lighting: String(metadata.lighting ?? "Studio"),
    license: String(metadata.license ?? "Creator-specified"),
    price: typeof rawPrice === "number" && rawPrice > 0 ? rawPrice : null,
    description: String(metadata.description ?? "An approved community-contributed 3D artifact."),
    image: upload.thumbnailUrl ?? "",
    video: upload.mediaType === "VIDEO" ? upload.fileUrl : undefined,
    model:
      upload.mediaType === "MODEL_3D" &&
      (upload.modelFormat === "glb" ||
        upload.modelFormat === "gltf" ||
        upload.modelFormat === "obj" ||
        upload.modelFormat === "stl")
        ? { url: upload.fileUrl, format: upload.modelFormat }
        : undefined,
    primaryMediaType:
      upload.mediaType === "MODEL_3D"
        ? "model"
        : upload.mediaType.toLowerCase() as "image" | "video",
  };
}

export function ordersToPurchasedAssets(
  orders: Array<{
    id: string;
    createdAt: Date;
    items: Array<{
      id: string;
      listing: ListingRecord;
    }>;
  }>,
): PurchasedAssetView[] {
  return orders.flatMap((order) =>
    order.items.map(({ id, listing }) => {
      const item = toMarketplaceView(listing);
      return {
        id,
        slug: item.slug,
        title: item.title,
        artist: item.artist,
        period: item.period,
        license: item.license,
        formats: [".glb"],
        acquiredDate: order.createdAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        image: item.image,
        video: item.video,
        model: item.model,
        primaryMediaType: item.primaryMediaType,
      };
    }),
  );
}

export function toUploadedAssetView(upload: {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "MODEL_3D";
  modelFormat: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  lightingPreset: string | null;
  lightTemperature: string | null;
  lightDirection: string | null;
  curatorComment: string | null;
  collectionSlug: string | null;
  metadata: unknown;
  views?: number;
  earnings?: number;
}): UploadedAssetView {
  const metadata =
    upload.metadata && typeof upload.metadata === "object"
      ? (upload.metadata as Record<string, unknown>)
      : {};
  return {
    id: upload.id,
    slug: String(metadata.slug ?? upload.id),
    title: upload.title,
    status:
      upload.status === "APPROVED"
        ? "live"
        : upload.status === "CHANGES_REQUESTED"
          ? "changes-requested"
        : upload.status === "REJECTED"
          ? "rejected"
          : "under-review",
    period: String(metadata.period ?? metadata.origin ?? "Awaiting review"),
    lightingPreset: upload.lightingPreset,
    lightTemperature: upload.lightTemperature,
    lightDirection: upload.lightDirection,
    curatorComment: upload.curatorComment,
    collectionSlug: upload.collectionSlug,
    material: upload.category,
    license: String(metadata.license ?? "Pending"),
    price: typeof metadata.price === "number" ? metadata.price : null,
    views: upload.views ?? 0,
    earnings: upload.earnings ?? 0,
    uploadedDate: String(
      metadata.uploadedDate ??
        new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    ),
    image: upload.thumbnailUrl ?? undefined,
    video: upload.mediaType === "VIDEO" ? upload.fileUrl : undefined,
    model:
      upload.mediaType === "MODEL_3D" &&
      (upload.modelFormat === "glb" ||
        upload.modelFormat === "gltf" ||
        upload.modelFormat === "obj" ||
        upload.modelFormat === "stl")
        ? { url: upload.fileUrl, format: upload.modelFormat }
        : undefined,
    primaryMediaType:
      upload.mediaType === "MODEL_3D"
        ? "model"
        : upload.mediaType.toLowerCase() as "image" | "video",
  };
}

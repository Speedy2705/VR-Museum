export type CollectionView = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  heroImage: string;
  category: string;
  count: number;
  video?: string;
  model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" | "usdz" };
  primaryMediaType?: "image" | "video" | "model";
};

export type MarketplaceView = {
  listingId: string;
  source: "museum" | "community";
  href?: string;
  uploaderId?: string;
  slug: string;
  title: string;
  artist: string;
  sellerRole?: "ARTIST" | "ARCHAEOLOGIST" | "CURATOR" | null;
  material: string;
  period: string;
  lighting: string;
  license: string;
  price: number | null;
  description: string;
  image: string;
  video?: string;
  model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" | "usdz" };
  primaryMediaType?: "image" | "video" | "model";
};

export type PurchasedAssetView = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  period: string;
  license: string;
  formats: string[];
  acquiredDate: string;
  image: string;
  video?: string;
  model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" | "usdz" };
  primaryMediaType?: "image" | "video" | "model";
};

export type UploadedAssetView = {
  id: string;
  slug: string;
  title: string;
  status: "live" | "under-review" | "changes-requested" | "rejected";
  lightingPreset: string | null;
  curatorComment: string | null;
  collectionSlug: string | null;
  period: string;
  material: string;
  license: string;
  price: number | null;
  views: number;
  earnings: number | null;
  uploadedDate: string;
  image?: string;
  video?: string;
  model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" | "usdz" };
  primaryMediaType?: "image" | "video" | "model";
};

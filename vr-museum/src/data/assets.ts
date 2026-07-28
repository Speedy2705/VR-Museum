export type PurchasedAsset = {
  slug: string;
  title: string;
  artist: string;
  period: string;
  license: string;
  formats: string[];
  acquiredDate: string;
};

export type UploadedAsset = {
  slug: string;
  title: string;
  status: "live" | "under-review";
  period: string;
  material: string;
  license: string;
  price: number | null;
  views: number;
  earnings: number | null;
  uploadedDate: string;
};

export const assetsStats = {
  totalEarnings: 1824,
  itemsSold: 150,
  activeListings: 2,
};

export const purchasedAssets: PurchasedAsset[] = [
  {
    slug: "roman-marble-portrait-bust",
    title: "Roman Marble Portrait Bust",
    artist: "Marco Ferri",
    period: "2nd c. CE",
    license: "CC0 Public Domain",
    formats: [".glb", ".obj", ".fbx"],
    acquiredDate: "12 Jul 2025",
  },
  {
    slug: "attic-red-figure-kylix",
    title: "Attic Red-Figure Kylix",
    artist: "Elena Vassiliev",
    period: "480–450 BCE",
    license: "CC-BY 4.0",
    formats: [".glb", ".gltf"],
    acquiredDate: "10 Jul 2025",
  },
  {
    slug: "benin-bronze-commemorative-head",
    title: "Benin Bronze Commemorative Head",
    artist: "Amir Hassan",
    period: "18th c. CE",
    license: "CC0 Public Domain",
    formats: [".glb", ".obj"],
    acquiredDate: "5 Jul 2025",
  },
  {
    slug: "shang-dynasty-bull-vessel",
    title: "Shang Dynasty Bull Vessel",
    artist: "Carlos Mendez",
    period: "1600–1046 BCE",
    license: "Personal Use",
    formats: [".glb", ".fbx", ".obj"],
    acquiredDate: "1 Jul 2025",
  },
];

export const uploadedAssets: UploadedAsset[] = [
  {
    slug: "cycladic-marble-figurine",
    title: "Cycladic Marble Figurine",
    status: "live",
    period: "2700 BCE",
    material: "Marble",
    license: "Personal Use",
    price: 48,
    views: 1240,
    earnings: 1824,
    uploadedDate: "20 Jun 2025",
  },
  {
    slug: "terracotta-female-figurine",
    title: "Terracotta Female Figurine",
    status: "live",
    period: "5th c. BCE",
    material: "Terracotta",
    license: "CC-BY-SA 4.0",
    price: null,
    views: 874,
    earnings: null,
    uploadedDate: "14 Jun 2025",
  },
  {
    slug: "attic-black-figure-amphora",
    title: "Attic Black-Figure Amphora",
    status: "under-review",
    period: "530–510 BCE",
    material: "Terracotta",
    license: "CC-BY 4.0",
    price: 55,
    views: 0,
    earnings: null,
    uploadedDate: "3 Jul 2025",
  },
];

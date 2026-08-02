import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { uploadedAssets } from "../data/assets";
import { collections } from "../data/collections";
import { getArtifactImage, getCollectionImage } from "../data/images";
import { marketplaceProducts } from "../data/marketplace";
import { getArtifactModel, getArtifactVideo } from "./media";
import { ARTIFACT_CATEGORIES, type CollectionSlug } from "./artifact-categories";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const collectionForMaterial: Record<string, string> = {
  Marble: "veins-of-marble",
  "Pentelic Marble": "veins-of-marble",
  Silver: "forged-in-time",
  Bronze: "forged-in-time",
  Terracotta: "earth-and-ember",
  Glass: "stories-in-color",
};

const collectionPresentation: Record<CollectionSlug, { subtitle: string; category: string }> = {
  "veins-of-marble": { subtitle: "Form revealed in luminous stone", category: "Marble" },
  "forged-in-time": { subtitle: "Metal shaped by ritual, craft, and history", category: "Metal" },
  "stories-in-color": { subtitle: "Culture and memory carried through colour", category: "Painting" },
  "echoes-in-stone": { subtitle: "Marks, inscriptions, and weathered memory", category: "Stone" },
  "earth-and-ember": { subtitle: "Earthen forms born from hand and flame", category: "Terracotta" },
  "community-uploads": { subtitle: "Discoveries beyond the five galleries", category: "Community" },
};

const videoArtifactSlugs = new Set([
  "attic-black-figure-amphora",
  "benin-bronze-commemorative-head",
  "roman-blue-glass-bowl",
]);
const modelArtifactSlugs = new Set([
  "cycladic-marble-figure",
  "shang-dynasty-bull-vessel",
  "portrait-bust-of-a-philosopher",
]);

function artifactMedia(slug: string) {
  if (videoArtifactSlugs.has(slug)) {
    return {
      videoUrl: getArtifactVideo(slug),
      modelUrl: null,
      modelFormat: null,
      primaryMediaType: "VIDEO" as const,
    };
  }
  if (modelArtifactSlugs.has(slug)) {
    return {
      videoUrl: null,
      modelUrl: getArtifactModel(slug),
      modelFormat: "glb",
      primaryMediaType: "MODEL_3D" as const,
    };
  }
  return {
    videoUrl: null,
    modelUrl: null,
    modelFormat: null,
    primaryMediaType: "IMAGE" as const,
  };
}

function sellerEmail(name: string) {
  const localPart = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, ".");
  return `${localPart}@seed.museum.local`;
}

async function main() {
  const collectionIds = new Map<string, string>();

  for (const category of ARTIFACT_CATEGORIES) {
    const presentation = collectionPresentation[category.key];
    const row = await prisma.collection.upsert({
      where: { slug: category.key },
      update: {
        title: category.name, subtitle: presentation.subtitle, description: category.description,
        heroImage: getCollectionImage(category.key) ?? "", category: presentation.category,
      },
      create: {
        slug: category.key, title: category.name, subtitle: presentation.subtitle,
        description: category.description, heroImage: getCollectionImage(category.key) ?? "", category: presentation.category,
      },
    });
    collectionIds.set(category.key, row.id);
  }

  const productsBySlug = new Map(
    marketplaceProducts.map((product) => [product.slug, product]),
  );

  for (const collection of collections) {
    for (const artifact of collection.artifacts) {
      const product = productsBySlug.get(artifact.slug);
      const media = artifactMedia(artifact.slug);
      await prisma.artifact.upsert({
        where: { slug: artifact.slug },
        update: {
          title: artifact.title,
          subtitle: `${artifact.period} · ${artifact.material}`,
          preset: artifact.lighting,
          image: getArtifactImage(artifact.slug),
          description: artifact.description,
          collectionId: collectionIds.get(collectionForMaterial[artifact.material] ?? "community-uploads")!,
          price: product?.price ?? null,
          isForSale: Boolean(product),
          ...media,
        },
        create: {
          slug: artifact.slug,
          title: artifact.title,
          subtitle: `${artifact.period} · ${artifact.material}`,
          preset: artifact.lighting,
          image: getArtifactImage(artifact.slug),
          description: artifact.description,
          collectionId: collectionIds.get(collectionForMaterial[artifact.material] ?? "community-uploads")!,
          price: product?.price ?? null,
          isForSale: Boolean(product),
          ...media,
        },
      });
    }
  }

  for (const product of marketplaceProducts) {
    const collectionSlug =
      collectionForMaterial[product.material] ?? "community-uploads";
    const artifact = await prisma.artifact.upsert({
      where: { slug: product.slug },
      update: {
        price: product.price,
        isForSale: true,
        ...artifactMedia(product.slug),
      },
      create: {
        slug: product.slug,
        title: product.title,
        subtitle: `${product.period} · ${product.material}`,
        preset: product.lighting,
        image: getArtifactImage(product.slug),
        description: product.description,
        collectionId: collectionIds.get(collectionSlug)!,
        price: product.price,
        isForSale: true,
        ...artifactMedia(product.slug),
      },
    });

    const seller = await prisma.user.upsert({
      where: { email: sellerEmail(product.artist) },
      update: { name: product.artist, role: "ARTIST" },
      create: {
        name: product.artist,
        email: sellerEmail(product.artist),
        passwordHash: "$seed$authentication-disabled",
        role: "ARTIST",
      },
    });

    await prisma.marketplaceListing.upsert({
      where: {
        artifactId_sellerId: {
          artifactId: artifact.id,
          sellerId: seller.id,
        },
      },
      update: {
        price: product.price ?? 0,
        currency: "USD",
        status: "ACTIVE",
      },
      create: {
        artifactId: artifact.id,
        sellerId: seller.id,
        price: product.price ?? 0,
        currency: "USD",
        status: "ACTIVE",
      },
    });
  }

  const owner = await prisma.user.upsert({
    where: { email: "demo.owner@seed.museum.local" },
    update: { name: "Demo Museum Owner", role: "CURATOR" },
    create: {
      name: "Demo Museum Owner",
      email: "demo.owner@seed.museum.local",
      passwordHash: "$seed$authentication-disabled",
      role: "CURATOR",
    },
  });

  for (const asset of uploadedAssets) {
    const data = {
      title: asset.title,
      category: asset.material,
      fileUrl: `/uploads/${asset.slug}.glb`,
      thumbnailUrl: getArtifactImage(asset.slug),
      mediaType: "MODEL_3D" as const,
      modelFormat: "glb",
      status:
        asset.status === "live" ? ("APPROVED" as const) : ("PENDING" as const),
      metadata: {
        slug: asset.slug,
        period: asset.period,
        license: asset.license,
        price: asset.price,
        views: asset.views,
        earnings: asset.earnings,
        uploadedDate: asset.uploadedDate,
        description: `${asset.title} is a community-contributed 3D artifact scan submitted for public study and reviewed by a museum curator.`,
      },
    };
    await prisma.uploadedAsset.upsert({
      where: {
        ownerId_title: {
          ownerId: owner.id,
          title: asset.title,
        },
      },
      update: data,
      create: {
        ownerId: owner.id,
        ...data,
      },
    });
  }

  const [collectionCount, artifactCount, listingCount, assetCount, userCount] =
    await Promise.all([
      prisma.collection.count(),
      prisma.artifact.count(),
      prisma.marketplaceListing.count(),
      prisma.uploadedAsset.count(),
      prisma.user.count(),
    ]);

  console.log(
    `Seeded ${collectionCount} collections, ${artifactCount} artifacts, ${listingCount} listings, ${assetCount} uploads, and ${userCount} users.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

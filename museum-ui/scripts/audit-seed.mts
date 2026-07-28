import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { collections } from "../src/data/collections";
import { marketplaceProducts } from "../src/data/marketplace";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

const expectedCollections = new Set(collections.map((item) => item.slug));
const expectedArtifacts = new Set([
  ...collections.flatMap((collection) => collection.artifacts.map((item) => item.slug)),
  ...marketplaceProducts.map((item) => item.slug),
]);

const [databaseCollections, databaseArtifacts, listings] = await Promise.all([
  prisma.collection.findMany({ select: { slug: true } }),
  prisma.artifact.findMany({ select: { slug: true } }),
  prisma.marketplaceListing.findMany({
    where: { status: "ACTIVE" },
    select: { artifact: { select: { slug: true } } },
  }),
]);

const actualCollections = new Set(databaseCollections.map((item) => item.slug));
const actualArtifacts = new Set(databaseArtifacts.map((item) => item.slug));
const actualListings = new Set(listings.map((item) => item.artifact.slug));
const missingCollections = [...expectedCollections].filter((slug) => !actualCollections.has(slug));
const missingArtifacts = [...expectedArtifacts].filter((slug) => !actualArtifacts.has(slug));
const missingListings = marketplaceProducts
  .map((item) => item.slug)
  .filter((slug) => !actualListings.has(slug));

console.log(JSON.stringify({
  expected: {
    collections: expectedCollections.size,
    artifacts: expectedArtifacts.size,
    marketplaceListings: marketplaceProducts.length,
  },
  actual: {
    collections: actualCollections.size,
    artifacts: actualArtifacts.size,
    marketplaceListings: actualListings.size,
  },
  missingCollections,
  missingArtifacts,
  missingListings,
}, null, 2));

await prisma.$disconnect();
if (missingCollections.length || missingArtifacts.length || missingListings.length) {
  process.exitCode = 1;
}

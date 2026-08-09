import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import { localizeRecord } from "@/lib/localized-content";
import { getRequestLocale } from "@/lib/request-locale";
import type { Locale } from "@/lib/i18n";
import { getLocalizedArtifact, getLocalizedCollection } from "@/server/services/content-translation.service";
import { mapWithConcurrency } from "@/server/concurrency";

export async function listArtifacts(filters: {
  collection?: string;
  preset?: string;
  query?: string;
}, localeOverride?: Locale) {
  const where: Prisma.ArtifactWhereInput = {};
  if (filters.collection) {
    where.collection = { slug: filters.collection };
  }
  if (filters.preset) {
    where.preset = { equals: filters.preset };
  }
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query } },
      { subtitle: { contains: filters.query } },
      { description: { contains: filters.query } },
      { collection: { title: { contains: filters.query } } },
    ];
  }
  const rows = await prisma.artifact.findMany({
    where,
    orderBy: { title: "asc" },
    include: { collection: true },
  });
  const locale = localeOverride ?? await getRequestLocale();
  if (locale === "en") return rows.map((row) => ({
    ...localizeRecord(row, locale, ["title", "subtitle", "description"]),
    collection: localizeRecord(row.collection, locale, ["title", "subtitle", "description", "category"]),
  }));
  const collections = new Map<string, typeof rows[number]["collection"]>();
  rows.forEach((row) => collections.set(row.collection.id, row.collection));
  const localizedCollections = await mapWithConcurrency([...collections.values()], 6, (collection) => getLocalizedCollection(collection, locale));
  const collectionsById = new Map(localizedCollections.map((collection) => [collection.id, collection]));
  return mapWithConcurrency(rows, 8, async (row) => ({
    ...await getLocalizedArtifact(row, locale),
    collection: collectionsById.get(row.collection.id) ?? row.collection,
  }));
}

export async function getArtifact(slug: string, localeOverride?: Locale) {
  const artifact = await prisma.artifact.findUnique({
    where: { slug },
    include: {
      collection: true,
      listings: {
        where: { status: "ACTIVE" },
        include: { seller: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!artifact) {
    throw new ServiceError("Artifact not found", "NOT_FOUND", 404);
  }
  const locale = localeOverride ?? await getRequestLocale();
  if (locale !== "en") {
    const [localizedArtifact, localizedCollection] = await Promise.all([
      getLocalizedArtifact(artifact, locale),
      getLocalizedCollection(artifact.collection, locale),
    ]);
    return { ...localizedArtifact, collection: localizedCollection };
  }
  return {
    ...localizeRecord(artifact, locale, ["title", "subtitle", "description"]),
    collection: localizeRecord(artifact.collection, locale, ["title", "subtitle", "description", "category"]),
  };
}

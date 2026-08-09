import type { Artifact, Collection, Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import { localizeRecord, translationFor } from "@/lib/localized-content";
import { prisma } from "@/lib/prisma";
import { translatePhrases } from "@/server/gemini-translation";

const fields = ["title", "subtitle", "description"] as const;
type ContentRecord = Artifact | Collection;

function hasCompleteTranslation(record: ContentRecord, locale: Locale) {
  const translation = translationFor(record.translations, locale);
  return fields.every((field) => typeof translation[field] === "string" && translation[field]);
}

function mergeTranslation(record: ContentRecord, locale: Exclude<Locale, "en">, values: string[]) {
  const existing = record.translations && typeof record.translations === "object" && !Array.isArray(record.translations)
    ? record.translations as Record<string, unknown>
    : {};
  return {
    ...existing,
    [locale]: Object.fromEntries(fields.map((field, index) => [field, values[index]])),
  } as Prisma.InputJsonValue;
}

async function translateRecord<T extends ContentRecord>(
  record: T,
  locale: Locale,
  persist: (translations: Prisma.InputJsonValue) => Promise<{ translations: Prisma.JsonValue }>,
): Promise<T> {
  if (locale === "en" || hasCompleteTranslation(record, locale)) {
    return localizeRecord(record, locale, fields);
  }
  try {
    const values = await translatePhrases(locale, fields.map((field) => record[field]));
    const translations = mergeTranslation(record, locale, values);
    const updated = await persist(translations);
    return localizeRecord({ ...record, translations: updated.translations } as T, locale, fields);
  } catch {
    return localizeRecord(record, "en", fields);
  }
}

export function getLocalizedArtifact<T extends Artifact>(artifact: T, locale: Locale) {
  return translateRecord(artifact, locale, (translations) => prisma.artifact.update({
    where: { id: artifact.id },
    data: { translations },
    select: { translations: true },
  }));
}

export function getLocalizedCollection<T extends Collection>(collection: T, locale: Locale) {
  return translateRecord(collection, locale, (translations) => prisma.collection.update({
    where: { id: collection.id },
    data: { translations },
    select: { translations: true },
  }));
}

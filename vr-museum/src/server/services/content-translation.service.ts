import type { Artifact, Collection, Prisma, UploadedAsset } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import { localizeRecord, translationFor } from "@/lib/localized-content";
import { hashTranslationSource, normalizeTranslationSource } from "@/lib/translation-hash";
import { prisma } from "@/lib/prisma";
import { translatePhrases } from "@/server/gemini-translation";

type TranslatableRecord = Artifact | Collection;
type TranslationObject = Record<string, unknown>;
const SOURCE_HASHES_KEY = "_sourceHashes";

function translationRoot(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function storedSourceHashes(translation: TranslationObject) {
  const value = translation[SOURCE_HASHES_KEY];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function translateRecord<T extends TranslatableRecord>(
  record: T,
  locale: Locale,
  fields: readonly (keyof T & string)[],
  persist: (translations: Prisma.InputJsonValue) => Promise<{ translations: Prisma.JsonValue }>,
): Promise<T> {
  if (locale === "en") return localizeRecord(record, locale, fields);

  const existingTranslation = translationFor(record.translations, locale);
  const existingHashes = storedSourceHashes(existingTranslation);
  const currentHashes = Object.fromEntries(fields.map((field) => [field, hashTranslationSource(String(record[field]))]));
  const hasHashMetadata = Object.keys(existingHashes).length > 0;
  const changedFields = fields.filter((field) => {
    const translated = existingTranslation[field];
    if (typeof translated !== "string" || !translated.trim()) return true;
    // Legacy translations predate source tracking. Preserve them once and
    // stamp the current source hashes, then invalidate field-by-field later.
    return hasHashMetadata && existingHashes[field] !== currentHashes[field];
  });

  try {
    const generated = changedFields.length
      ? await translatePhrases(locale, changedFields.map((field) => normalizeTranslationSource(String(record[field]))))
      : [];
    const localizedValues = {
      ...existingTranslation,
      ...Object.fromEntries(changedFields.map((field, index) => [field, generated[index]])),
      [SOURCE_HASHES_KEY]: currentHashes,
    };
    const needsHashStamp = fields.some((field) => existingHashes[field] !== currentHashes[field]);
    if (!changedFields.length && !needsHashStamp) return localizeRecord(record, locale, fields);

    const translations = {
      ...translationRoot(record.translations),
      [locale]: localizedValues,
    } as Prisma.InputJsonValue;
    const updated = await persist(translations);
    return localizeRecord({ ...record, translations: updated.translations } as T, locale, fields);
  } catch {
    // A stale translation must never be shown after its English source changes.
    if (changedFields.length) return localizeRecord(record, "en", fields);
    return localizeRecord(record, locale, fields);
  }
}

export function getLocalizedArtifact<T extends Artifact>(artifact: T, locale: Locale) {
  return translateRecord(artifact, locale, ["title", "subtitle", "description"], (translations) => prisma.artifact.update({
    where: { id: artifact.id },
    data: { translations },
    select: { translations: true },
  }));
}

export function getLocalizedCollection<T extends Collection>(collection: T, locale: Locale) {
  return translateRecord(collection, locale, ["title", "subtitle", "description", "category"], (translations) => prisma.collection.update({
    where: { id: collection.id },
    data: { translations },
    select: { translations: true },
  }));
}

function uploadEnglishFields(upload: UploadedAsset) {
  const metadata = upload.metadata && typeof upload.metadata === "object" && !Array.isArray(upload.metadata)
    ? upload.metadata as Record<string, unknown>
    : {};
  return {
    title: upload.title,
    material: String(metadata.material ?? upload.category),
    origin: String(metadata.origin ?? metadata.period ?? "Not specified"),
    description: String(metadata.description ?? "An approved community-contributed 3D artifact."),
  };
}

export async function getLocalizedUpload<T extends UploadedAsset>(upload: T, locale: Locale): Promise<T> {
  if (locale === "en") return upload;
  const english = uploadEnglishFields(upload);
  const fields = Object.keys(english) as (keyof typeof english)[];
  const existing = translationFor(upload.translations, locale);
  const existingHashes = storedSourceHashes(existing);
  const currentHashes = Object.fromEntries(fields.map((field) => [field, hashTranslationSource(english[field])]));
  const hasHashMetadata = Object.keys(existingHashes).length > 0;
  const changedFields = fields.filter((field) => {
    const translated = existing[field];
    return typeof translated !== "string" || !translated.trim() || (hasHashMetadata && existingHashes[field] !== currentHashes[field]);
  });

  try {
    const generated = changedFields.length
      ? await translatePhrases(locale, changedFields.map((field) => normalizeTranslationSource(english[field])))
      : [];
    const localizedValues = {
      ...existing,
      ...Object.fromEntries(changedFields.map((field, index) => [field, generated[index]])),
      [SOURCE_HASHES_KEY]: currentHashes,
    };
    const needsHashStamp = fields.some((field) => existingHashes[field] !== currentHashes[field]);
    if (!changedFields.length && !needsHashStamp) return upload;
    const translations = { ...translationRoot(upload.translations), [locale]: localizedValues } as Prisma.InputJsonValue;
    const updated = await prisma.uploadedAsset.update({
      where: { id: upload.id },
      data: { translations },
      select: { translations: true },
    });
    return { ...upload, translations: updated.translations };
  } catch {
    if (!changedFields.length) return upload;
    const withoutStaleLocale = { ...translationRoot(upload.translations) };
    delete withoutStaleLocale[locale];
    return { ...upload, translations: withoutStaleLocale as Prisma.JsonValue };
  }
}

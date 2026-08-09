import "server-only";

import type { Locale } from "@/lib/i18n";
import { hashTranslationSource, legacyTranslationSourceHash, normalizeTranslationSource } from "@/lib/translation-hash";
import { prisma } from "@/lib/prisma";
import { translatePhrases } from "@/server/gemini-translation";

export async function getLocalizedUiPhrases(locale: Locale, phrases: string[]) {
  if (locale === "en" || phrases.length === 0) return phrases;

  try {
    const requested = phrases.map((phrase) => ({
      phrase,
      sourceHash: hashTranslationSource(phrase),
      legacyHash: legacyTranslationSourceHash(phrase),
      sourceText: normalizeTranslationSource(phrase),
    }));
    const cachedRows = await prisma.translationCache.findMany({
      where: { locale, sourceHash: { in: [...new Set(requested.flatMap(({ sourceHash, legacyHash }) => [sourceHash, legacyHash]))] } },
      select: { sourceHash: true, sourceText: true, translatedText: true },
    });
    const cachedByHash = new Map(cachedRows.map((row) => [row.sourceHash, row]));
    const translatedByHash = new Map<string, string>();
    const migrationRows: { locale: typeof locale; sourceHash: string; sourceText: string; translatedText: string }[] = [];
    requested.forEach(({ sourceHash, legacyHash, sourceText }) => {
      const canonical = cachedByHash.get(sourceHash);
      const legacy = cachedByHash.get(legacyHash);
      const cached = canonical ?? (legacy && normalizeTranslationSource(legacy.sourceText ?? "") === sourceText ? legacy : undefined);
      if (cached) {
        translatedByHash.set(sourceHash, cached.translatedText);
        if (!canonical) migrationRows.push({ locale, sourceHash, sourceText, translatedText: cached.translatedText });
      }
    });
    const missing = [...new Map(
      requested
        .filter(({ sourceHash }) => !translatedByHash.has(sourceHash))
        .map((entry) => [entry.sourceHash, entry]),
    ).values()];

    if (missing.length) {
      const generated = await translatePhrases(locale, missing.map(({ sourceText }) => sourceText));
      const rows = missing.map((entry, index) => ({
        locale,
        sourceHash: entry.sourceHash,
        sourceText: entry.sourceText,
        translatedText: generated[index],
      }));
      await prisma.translationCache.createMany({ data: [...migrationRows, ...rows], skipDuplicates: true });
      rows.forEach((row) => translatedByHash.set(row.sourceHash, row.translatedText));
    } else if (migrationRows.length) {
      await prisma.translationCache.createMany({ data: migrationRows, skipDuplicates: true });
    }

    return requested.map(({ phrase, sourceHash }) => translatedByHash.get(sourceHash) ?? phrase);
  } catch {
    // Metadata must never make a page unavailable; English is the safe fallback.
    return phrases;
  }
}

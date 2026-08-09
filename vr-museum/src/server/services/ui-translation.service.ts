import "server-only";

import type { Locale } from "@/lib/i18n";
import { hashTranslationSource, normalizeTranslationSource } from "@/lib/translation-hash";
import { prisma } from "@/lib/prisma";
import { translatePhrases } from "@/server/gemini-translation";

export async function getLocalizedUiPhrases(locale: Locale, phrases: string[]) {
  if (locale === "en" || phrases.length === 0) return phrases;

  try {
    const requested = phrases.map((phrase) => ({
      phrase,
      sourceHash: hashTranslationSource(phrase),
      sourceText: normalizeTranslationSource(phrase),
    }));
    const cachedRows = await prisma.translationCache.findMany({
      where: { locale, sourceHash: { in: [...new Set(requested.map(({ sourceHash }) => sourceHash))] } },
      select: { sourceHash: true, translatedText: true },
    });
    const translatedByHash = new Map(cachedRows.map((row) => [row.sourceHash, row.translatedText]));
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
      await prisma.translationCache.createMany({ data: rows, skipDuplicates: true });
      rows.forEach((row) => translatedByHash.set(row.sourceHash, row.translatedText));
    }

    return requested.map(({ phrase, sourceHash }) => translatedByHash.get(sourceHash) ?? phrase);
  } catch {
    // Metadata must never make a page unavailable; English is the safe fallback.
    return phrases;
  }
}

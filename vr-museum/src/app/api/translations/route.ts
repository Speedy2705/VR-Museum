import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRequestIdentity } from "@/lib/rate-limit";
import { hashTranslationSource, normalizeTranslationSource } from "@/lib/translation-hash";
import { GeminiTranslationError, translatePhrases } from "@/server/gemini-translation";

const schema = z.object({
  locale: z.enum(locales).refine((locale) => locale !== "en"),
  phrases: z.array(z.string().trim().min(1).max(500)).min(1).max(120),
});

// Postgres is the restart-safe source of truth; localStorage is the client-side speed layer.
export async function POST(request: Request) {
  const rate = checkRateLimit(`translations:${getRequestIdentity(request)}`, { limit: 5, windowMs: 60_000 });
  if (!rate.allowed) return apiError("Too many translation requests", { status: 429 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("Invalid translation request", { status: 400, details: parsed.error.flatten() });
  const { locale, phrases } = parsed.data;
  const translations: Record<string, string> = {};
  const requested = phrases.map((phrase) => ({
    phrase,
    sourceHash: hashTranslationSource(phrase),
    sourceText: normalizeTranslationSource(phrase),
  }));
  const cachedRows = await prisma.translationCache.findMany({
    where: { locale, sourceHash: { in: [...new Set(requested.map(({ sourceHash }) => sourceHash))] } },
    select: { sourceHash: true, translatedText: true },
  });
  const cachedByHash = new Map(cachedRows.map((row) => [row.sourceHash, row.translatedText]));
  const missingByHash = new Map<string, { sourceHash: string; sourceText: string }>();
  requested.forEach(({ phrase, sourceHash, sourceText }) => {
    const cached = cachedByHash.get(sourceHash);
    if (cached) translations[phrase] = cached;
    else if (!missingByHash.has(sourceHash)) missingByHash.set(sourceHash, { sourceHash, sourceText });
  });
  const missingEntries = [...missingByHash.values()];
  const missing = missingEntries.map(({ sourceText }) => sourceText);
  if (!missing.length) return apiSuccess({ translations });

  let generated: string[];
  try {
    generated = await translatePhrases(locale, missing);
  } catch (error) {
    if (error instanceof GeminiTranslationError && error.code === "NOT_CONFIGURED") {
      return apiError("Gemini translation is not configured", { status: 503 });
    }
    if (error instanceof GeminiTranslationError && error.code === "INVALID_RESPONSE") {
      return apiError("Gemini returned an invalid translation", { status: 502 });
    }
    return apiError("Gemini translation failed", { status: error instanceof GeminiTranslationError && error.code === "RATE_LIMITED" ? 503 : 502 });
  }
  const newRows: { locale: typeof locale; sourceHash: string; sourceText: string; translatedText: string }[] = [];
  missingEntries.forEach(({ sourceHash, sourceText }, index) => {
    const value = generated[index];
    if (typeof value === "string" && value.trim()) {
      requested.forEach(({ phrase, sourceHash: requestedHash }) => {
        if (requestedHash === sourceHash) translations[phrase] = value;
      });
      newRows.push({ locale, sourceHash, sourceText, translatedText: value });
    }
  });
  if (newRows.length) await prisma.translationCache.createMany({ data: newRows, skipDuplicates: true });
  return apiSuccess({ translations });
}

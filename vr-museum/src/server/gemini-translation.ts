import type { Locale } from "@/lib/i18n";

export const SYSTEM_INSTRUCTION = `Localize English museum website copy into the requested language.

Preserve the source's meaning, emotional force, passion, and level of formality—not its word order. Write as a museum lover speaking naturally to artisans, customers, consumers, and museum visitors. Prefer an evocative, idiomatic, culturally resonant equivalent over a literal or word-for-word translation. You may freely change sentence structure, imagery, idioms, and phrasing, provided the central meaning and impact remain the same. Keep concise UI copy reasonably compact, but prioritize impact over matching the English length.

Keep all proper names, artisan names, artwork titles that must not be localized, locations, materials, dates, historical facts, numbers, URLs, placeholders, punctuation, HTML entities, and the ViswaRoop brand accurate. Never invent or embellish factual claims. If a phrase is already in the target language, return it unchanged. Return only the translations, in exactly the input order, with no notes or explanations.`;

export type GeminiTranslationErrorCode = "NOT_CONFIGURED" | "RATE_LIMITED" | "REQUEST_FAILED" | "INVALID_RESPONSE";

export class GeminiTranslationError extends Error {
  constructor(public readonly code: GeminiTranslationErrorCode) {
    super(code);
    this.name = "GeminiTranslationError";
  }
}

export async function translatePhrases(locale: Exclude<Locale, "en">, phrases: string[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_TRANSLATION_MODEL ?? "gemini-3.5-flash-lite";
  if (!apiKey) throw new GeminiTranslationError("NOT_CONFIGURED");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify({ targetLanguage: locale, phrases }) }] }],
      generationConfig: {
        maxOutputTokens: 12000,
        responseMimeType: "application/json",
        responseJsonSchema: { type: "object", properties: { translations: { type: "array", items: { type: "string" }, minItems: phrases.length, maxItems: phrases.length } }, required: ["translations"], additionalProperties: false },
      },
    }),
  });
  if (!response.ok) {
    throw new GeminiTranslationError(response.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED");
  }

  let generated: unknown;
  try {
    const body = await response.json();
    const text = body.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "{}";
    generated = JSON.parse(text).translations;
  } catch {
    throw new GeminiTranslationError("INVALID_RESPONSE");
  }
  if (!Array.isArray(generated) || generated.length !== phrases.length || generated.some((value) => typeof value !== "string" || !value.trim())) {
    throw new GeminiTranslationError("INVALID_RESPONSE");
  }
  return generated as string[];
}

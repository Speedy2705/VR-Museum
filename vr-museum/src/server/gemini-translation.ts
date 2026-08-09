import type { Locale } from "@/lib/i18n";

const SYSTEM_INSTRUCTION = "Translate museum website UI from English to the requested language. Preserve brand names, URLs, numbers, placeholders, punctuation, and HTML entities. Return translations in exactly the input order.";

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

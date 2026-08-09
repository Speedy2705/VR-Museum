import { createHash } from "node:crypto";

export function normalizeTranslationSource(sourceText: string) {
  return sourceText.replace(/\s+/g, " ").trim();
}

export function hashTranslationSource(sourceText: string) {
  const normalized = normalizeTranslationSource(sourceText);
  return createHash("sha256").update(normalized.toLowerCase()).digest("hex");
}

import { createHash } from "node:crypto";
import { TRANSLATION_POLICY_VERSION } from "@/lib/translation-policy";

export function normalizeTranslationSource(sourceText: string) {
  return sourceText.replace(/\s+/g, " ").trim();
}

export function hashTranslationSource(sourceText: string) {
  const normalized = normalizeTranslationSource(sourceText);
  return createHash("sha256").update(`${TRANSLATION_POLICY_VERSION}:${normalized}`).digest("hex");
}

/** Previous cache key format retained only for lossless cache migration. */
export function legacyTranslationSourceHash(sourceText: string) {
  const normalized = normalizeTranslationSource(sourceText);
  return createHash("sha256").update(`${TRANSLATION_POLICY_VERSION}:${normalized.toLowerCase()}`).digest("hex");
}

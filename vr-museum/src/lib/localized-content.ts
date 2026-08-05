import type { Locale } from "@/lib/i18n";

type Translation = Record<string, unknown>;

export function translationFor(value: unknown, locale: Locale): Translation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const translations = value as Record<string, unknown>;
  const localized = translations[locale] ?? translations.en;
  return localized && typeof localized === "object" && !Array.isArray(localized)
    ? localized as Translation
    : {};
}

export function localizeRecord<T extends Record<string, unknown>>(
  record: T,
  locale: Locale,
  fields: readonly string[],
): T {
  const localized = translationFor(record.translations, locale);
  return {
    ...record,
    ...Object.fromEntries(fields.flatMap((field) =>
      typeof localized[field] === "string" && localized[field] ? [[field, localized[field]]] : [],
    )),
  };
}

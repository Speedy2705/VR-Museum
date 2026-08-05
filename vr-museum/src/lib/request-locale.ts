import "server-only";
import { headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const locale = (await headers()).get("x-museum-locale");
  return isLocale(locale) ? locale : defaultLocale;
}

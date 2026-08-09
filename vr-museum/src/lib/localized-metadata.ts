import "server-only";

import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedUiPhrases } from "@/server/services/ui-translation.service";

export async function localizedMetadata(title: string, description?: string): Promise<Metadata> {
  const locale = await getRequestLocale();
  const [localizedTitle, localizedDescription] = await getLocalizedUiPhrases(
    locale,
    description ? [title, description] : [title],
  );
  return { title: localizedTitle, ...(description ? { description: localizedDescription } : {}) };
}

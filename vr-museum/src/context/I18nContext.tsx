"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { languageNames, localizePath, messages, rtlLocales, type Locale, type Messages } from "@/lib/i18n";

const I18nContext = createContext<{ locale: Locale; messages: Messages }>({ locale: "en", messages: messages.en });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = rtlLocales.has(locale) ? "rtl" : "ltr";
  }, [locale]);
  return <I18nContext.Provider value={{ locale, messages: messages[locale] }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }

export function LanguageSelector({ authenticated = false }: { authenticated?: boolean }) {
  const { locale, messages: t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  async function change(next: Locale) {
    document.cookie = `museum-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    if (authenticated) {
      await fetch("/api/profile/language", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: next }) });
    }
    router.push(localizePath(pathname, next));
  }
  return <label className="flex items-center gap-2 text-[10px] tracking-label uppercase text-white/70">
    <span className="sr-only">{t.language}</span>
    <select aria-label={t.language} value={locale} onChange={(event) => void change(event.target.value as Locale)} className="max-w-28 bg-transparent py-2 text-white outline-none [&>option]:bg-ink">
      {(Object.keys(languageNames) as Locale[]).map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}
    </select>
  </label>;
}

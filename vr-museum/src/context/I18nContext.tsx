"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { languageNames, localizePath, messages, rtlLocales, type Locale, type Messages } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { museumToast } from "@/lib/museum-toast";
import BrandLogo from "@/components/ui/BrandLogo";

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
  const { update: updateSession } = useSession();
  const pathname = usePathname();
  const [changingTo, setChangingTo] = useState<Locale | null>(null);
  async function change(next: Locale) {
    if (next === locale) return;
    setChangingTo(next);
    document.cookie = `museum-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    try {
      if (authenticated) {
        const response = await fetch("/api/profile/language", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: next }) });
        if (!response.ok) throw new Error("Language preference was not saved");
        await updateSession();
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      window.location.assign(localizePath(pathname, next));
    } catch {
      document.cookie = `museum-locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
      setChangingTo(null);
      museumToast.error("Language was not changed", "Your saved preference could not be updated. Please try again.");
    }
  }
  return <>
    <label data-no-translate className="flex items-center gap-2 text-[10px] tracking-label uppercase text-white/70">
      <span className="sr-only">{t.language}</span>
      <select aria-label={t.language} value={changingTo ?? locale} disabled={changingTo !== null} onChange={(event) => void change(event.target.value as Locale)} className="max-w-28 bg-transparent py-2 text-white outline-none disabled:cursor-wait disabled:opacity-70 [&>option]:bg-ink">
        {(Object.keys(languageNames) as Locale[]).map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}
      </select>
    </label>
    {changingTo && typeof document !== "undefined" && createPortal(
      <div role="status" aria-live="polite" aria-label="Changing language" className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 text-cream backdrop-blur-sm">
        <div className="flex flex-col items-center gap-5">
          <BrandLogo variant="light" className="h-auto w-40" />
          <span aria-hidden className="h-7 w-7 animate-spin rounded-full border border-cream/35 border-t-cream" />
          <span data-no-translate className="text-[10px] tracking-label uppercase text-cream/65">{languageNames[changingTo]}</span>
          <span className="sr-only">Changing language…</span>
        </div>
      </div>,
      document.body,
    )}
  </>;
}

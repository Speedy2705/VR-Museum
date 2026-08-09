export const locales = ["en", "hi", "mr", "bn", "ta", "te", "gu", "pa", "ur", "es", "fr", "de", "ar", "zh", "ja", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales = new Set<Locale>(["ar", "ur"]);

// Native language names are identifiers, not translated UI copy.
export const languageNames: Record<Locale, string> = {
  en: "English", hi: "हिन्दी", mr: "मराठी", bn: "বাংলা", ta: "தமிழ்",
  te: "తెలుగు", gu: "ગુજરાતી", pa: "ਪੰਜਾਬੀ", ur: "اردو", es: "Español",
  fr: "Français", de: "Deutsch", ar: "العربية", zh: "中文", ja: "日本語", ko: "한국어",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : null;
}

export function localizePath(pathname: string, locale: Locale) {
  if (!pathname.startsWith("/") || pathname.startsWith("/api/")) return pathname;
  const current = localeFromPathname(pathname);
  const rest = current ? pathname.slice(current.length + 1) || "/" : pathname;
  return `/${locale}${rest === "/" ? "" : rest}`;
}

const englishMessages = {
  collections: "Collections", marketplace: "Marketplace", about: "About", assets: "Your Assets",
  upload: "Upload", support: "Queries & Feedback", moderate: "Moderate Uploads", signIn: "Sign In",
  signOut: "Sign Out", enterVr: "Enter VR", search: "Search artifacts",
  searchPlaceholder: "Search artifacts, materials, or collections…", searching: "Searching…",
  noResults: "No artifacts found.", account: "Museum member", mobileAccount: "Mobile account",
  language: "Language", closeMenu: "Close menu", openMenu: "Open menu", accountMenu: "Open account menu",
  signOutTitle: "Sign out of the museum?",
  signOutDescription: "Your cart and account data will remain safely stored for your next visit.",
} as const;

export type Messages = Record<keyof typeof englishMessages, string>;
// Components render one English source of truth; Gemini translates the resulting page.
export const messages = Object.fromEntries(locales.map((locale) => [locale, englishMessages])) as Record<Locale, Messages>;

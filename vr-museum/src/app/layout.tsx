import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";
import { headers } from "next/headers";
import { defaultLocale, isLocale, rtlLocales } from "@/lib/i18n";
import { getLocalizedUiPhrases } from "@/server/services/ui-translation.service";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestedLocale = (await headers()).get("x-museum-locale");
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [title, description, openGraphDescription] = await getLocalizedUiPhrases(locale, [
    "ViswaRoop — Explore. Experience. Own History.",
    "Explore, contribute, curate, license, and collect cultural artifacts through a multilingual immersive 3D museum.",
    "Step inside ViswaRoop, a multilingual virtual museum for cultural discovery, immersive 3D experiences, and licensed digital artifacts.",
  ]);
  return {
    metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
    title: { default: title, template: "%s | ViswaRoop" },
    description,
    icons: {
      icon: "/brand/viswaroop-mark.svg",
      shortcut: "/brand/viswaroop-mark.svg",
      apple: "/brand/viswaroop-mark.svg",
    },
    openGraph: {
      type: "website",
      siteName: "ViswaRoop",
      title,
      description: openGraphDescription,
      images: ["/images/hero-gallery.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestedLocale = (await headers()).get("x-museum-locale");
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  return (
    <html lang={locale} dir={rtlLocales.has(locale) ? "rtl" : "ltr"}>
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div id="main-content" tabIndex={-1}>
          <AppProviders locale={locale}>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";
import { headers } from "next/headers";
import { defaultLocale, isLocale, rtlLocales } from "@/lib/i18n";

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "ViswaRoop — Explore. Experience. Own History.",
    template: "%s | ViswaRoop",
  },
  description:
    "Upload and explore historically significant artifacts in an immersive virtual museum.",
  openGraph: {
    type: "website",
    siteName: "ViswaRoop",
    title: "ViswaRoop — Explore. Experience. Own History.",
    description:
      "Explore historically significant artifacts in an immersive virtual museum.",
    images: ["/images/hero-vr-banner.png"],
  },
};

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
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}

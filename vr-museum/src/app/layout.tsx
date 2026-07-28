import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

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
    default: "NAME — Virtual Museum of Artifacts",
    template: "%s | NAME",
  },
  description:
    "Upload and explore historically significant artifacts in an immersive virtual museum.",
  openGraph: {
    type: "website",
    siteName: "NAME",
    title: "NAME — Virtual Museum of Artifacts",
    description:
      "Explore historically significant artifacts in an immersive virtual museum.",
    images: ["/images/hero-vr-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

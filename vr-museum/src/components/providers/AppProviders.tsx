"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { CartProvider } from "@/context/CartContext";
import PageTransition from "@/components/motion/PageTransition";
import { Toaster } from "sonner";
import { I18nProvider } from "@/context/I18nContext";
import type { Locale } from "@/lib/i18n";

export default function AppProviders({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <SessionProvider>
      <I18nProvider locale={locale}><CartProvider>
        <PageTransition>{children}</PageTransition>
        <Toaster
          position="bottom-right"
          closeButton
          visibleToasts={4}
          gap={10}
          toastOptions={{
            duration: 5000,
            style: {
              background: "var(--color-cream)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-line)",
              borderRadius: 0,
            },
          }}
        />
      </CartProvider></I18nProvider>
    </SessionProvider>
  );
}

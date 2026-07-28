"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { CartProvider } from "@/context/CartContext";
import PageTransition from "@/components/motion/PageTransition";
import { Toaster } from "sonner";
import BackButton from "@/components/layout/BackButton";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <PageTransition>{children}</PageTransition>
        <BackButton />
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
      </CartProvider>
    </SessionProvider>
  );
}

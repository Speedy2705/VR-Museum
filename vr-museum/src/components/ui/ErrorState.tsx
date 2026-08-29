"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";
import BrandLogo from "@/components/ui/BrandLogo";

export default function ErrorState({
  error,
  reset,
  title = "This gallery is temporarily unavailable",
  message = "We couldn’t load this part of the museum. Please try again.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
}) {
  useEffect(() => {
    logger.error("Route error boundary rendered", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-cream px-6 py-20 text-center">
      <div className="max-w-lg">
        <BrandLogo markOnly className="mx-auto mb-6 h-auto w-24 opacity-70" />
        <p className="text-xs tracking-label text-stone uppercase">
          A quiet room
        </p>
        <h1 className="font-display mt-5 text-4xl italic">{title}</h1>
        <p className="mt-5 text-sm leading-relaxed text-stone">{message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 bg-ink px-7 py-3.5 text-xs tracking-label text-cream uppercase hover:bg-charcoal"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

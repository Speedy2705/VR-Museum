"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type SignInPromptProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  returnTo: string;
};

export default function SignInPrompt({
  open,
  onClose,
  title,
  description,
  returnTo,
}: SignInPromptProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 px-6 py-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-prompt-title"
        tabIndex={-1}
        className="max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto bg-cream p-8 text-center outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="sign-in-prompt-title" className="font-display text-3xl italic text-ink">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone">
          {description}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
            className="bg-ink px-7 py-3.5 text-xs tracking-label text-cream uppercase hover:bg-charcoal"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="border border-line px-7 py-3.5 text-xs tracking-label text-ink uppercase hover:bg-cream-dark"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

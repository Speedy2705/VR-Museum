"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import LogoLoader from "@/components/ui/LogoLoader";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  confirmDisabled?: boolean;
  tone?: "danger" | "important";
  children?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  confirmDisabled = false,
  tone = "danger",
  children,
  initialFocusRef,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => (initialFocusRef?.current ?? cancelRef.current)?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
      if (event.key !== "Tab") return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])",
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [initialFocusRef, onCancel, open, pending]);

  const dialog = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/70 px-6 py-6"
          onClick={() => !pending && onCancel()}
        >
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            className="max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto bg-cream p-8 text-ink"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs tracking-label uppercase text-stone">Please confirm</p>
            <h2 id="confirm-dialog-title" className="font-display mt-3 text-3xl italic">{title}</h2>
            <p id="confirm-dialog-description" className="mt-4 text-sm leading-relaxed text-stone">{description}</p>
            {children}
            <div className="mt-8 flex justify-end gap-3">
              <button ref={cancelRef} type="button" disabled={pending} onClick={onCancel} className="border border-line px-6 py-3 text-xs tracking-label uppercase hover:bg-cream-dark disabled:opacity-50">
                Keep
              </button>
              <button type="button" disabled={pending || confirmDisabled} onClick={onConfirm} className={`px-6 py-3 text-xs tracking-label uppercase text-white disabled:cursor-not-allowed disabled:opacity-50 ${tone === "danger" ? "bg-red-900 hover:bg-red-800" : "bg-ink hover:bg-charcoal"}`}>
                {pending ? <><LogoLoader label="Working" size="sm" tone="light" showLabel={false} className="me-2 align-middle" />Working…</> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
}

"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

type ToastVariant = "success" | "error" | "warning" | "info";

const icons: Record<ToastVariant, ReactNode> = {
  success: <path d="m5 12 4 4L19 6" />,
  error: <><path d="m7 7 10 10M17 7 7 17" /></>,
  warning: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
};

function icon(variant: ToastVariant) {
  return (
    <span className={`museum-toast__icon museum-toast__icon--${variant}`} aria-hidden="true">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icons[variant]}
      </svg>
    </span>
  );
}

function show(variant: ToastVariant, title: string, description?: string) {
  return toast[variant](title, {
    description,
    icon: icon(variant),
    closeButton: true,
    className: `museum-toast museum-toast--${variant}`,
  });
}

export const museumToast = {
  success: (title: string, description?: string) => show("success", title, description),
  error: (title: string, description?: string) => show("error", title, description),
  warning: (title: string, description?: string) => show("warning", title, description),
  info: (title: string, description?: string) => show("info", title, description),
  dismiss: toast.dismiss,
};

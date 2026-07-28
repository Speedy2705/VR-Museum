"use client";

import { logger } from "@/lib/logger";
import { museumToast } from "@/lib/museum-toast";

export function notifyError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  const message = error instanceof Error ? error.message : fallback;
  logger.error("Client operation failed", { error, message });
  museumToast.error("Something went wrong", message || fallback);
  return message || fallback;
}

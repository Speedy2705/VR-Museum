import { logger } from "@/lib/logger";
import { museumToast } from "@/lib/museum-toast";

window.addEventListener("error", (event) => {
  logger.error("Unhandled client error", {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
  });
  museumToast.error(
    "Unexpected client error",
    "Something went wrong. You can dismiss this message and try again.",
  );
});

window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled client promise rejection", {
    reason:
      event.reason instanceof Error ? event.reason.message : String(event.reason),
  });
  museumToast.error(
    "Unexpected client error",
    "A background action failed unexpectedly. Please try again.",
  );
});

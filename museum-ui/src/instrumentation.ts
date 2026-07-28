import type { Instrumentation } from "next";
import { logger } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  logger.error("Unhandled server request error", {
    error,
    path: request.path,
    routerKind: context.routerKind,
    routeType: context.routeType,
  });
};

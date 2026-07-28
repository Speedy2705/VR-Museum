import { ZodError } from "zod";

import { apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { ServiceError } from "@/lib/service-error";

export function handleRouteError(error: unknown, route: string) {
  if (error instanceof ZodError) {
    return apiError("Request validation failed", {
      code: "VALIDATION_ERROR",
      details: error.flatten(),
      status: 400,
    });
  }

  if (error instanceof SyntaxError) {
    return apiError("Request body must be valid JSON", {
      code: "INVALID_JSON",
      status: 400,
    });
  }

  if (error instanceof ServiceError) {
    return apiError(error.message, {
      code: error.code,
      details: error.details,
      status: error.status,
    });
  }

  logger.error("API route failed", { error, route });
  return apiError("An unexpected error occurred", {
    code: "INTERNAL_ERROR",
    status: 500,
  });
}

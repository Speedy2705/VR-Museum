import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getHealthStatus } from "@/server/services/health.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess(await getHealthStatus());
  } catch (error) {
    logger.error("Health check failed", { error });
    return apiError("Database health check failed", {
      code: "DATABASE_UNAVAILABLE",
      status: 503,
    });
  }
}

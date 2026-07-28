import type { NextRequest } from "next/server";

import { handlers } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { checkRateLimit, getRequestIdentity } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";

export async function GET(request: NextRequest) {
  try {
    return await handlers.GET(request);
  } catch (error) {
    return handleRouteError(error, "GET /api/auth/[...nextauth]");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(`auth:${getRequestIdentity(request)}`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return apiError("Too many authentication attempts", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }
    return await handlers.POST(request);
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/[...nextauth]");
  }
}

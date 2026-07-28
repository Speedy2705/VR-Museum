import { apiError, apiSuccess } from "@/lib/api-response";
import { getRequestIdentity, checkRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { registerSchema } from "@/lib/validators/user";
import { registerUser } from "@/server/services/user.service";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`register:${getRequestIdentity(request)}`, {
      limit: 5,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return apiError("Too many registration attempts", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const input = registerSchema.parse(await request.json());
    return apiSuccess(await registerUser(input), {
      message: "Account created",
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/register");
  }
}

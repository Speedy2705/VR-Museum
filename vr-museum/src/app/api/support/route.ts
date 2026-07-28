import { z } from "zod";
import { apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { ServiceError } from "@/lib/service-error";
import { createSupportRequest } from "@/server/services/support.service";

const schema = z.object({
  type: z.enum(["QUERY", "FEEDBACK"]),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(3000),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ServiceError("Sign in to submit a query or feedback", "UNAUTHORIZED", 401);
    const result = await createSupportRequest(user.id, schema.parse(await request.json()));
    return apiSuccess({ id: result.id }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/support");
  }
}

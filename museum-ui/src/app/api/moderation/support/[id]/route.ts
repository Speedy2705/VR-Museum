import { z } from "zod";
import { apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { hasPermission } from "@/lib/role-policy";
import { ServiceError } from "@/lib/service-error";
import { answerSupportRequest } from "@/server/services/support.service";

const schema = z.object({ response: z.string().trim().min(3).max(3000) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ServiceError("Authentication required", "UNAUTHORIZED", 401);
    if (!hasPermission(user.role, "moderateUploads")) throw new ServiceError("Curator access required", "FORBIDDEN", 403);
    const { id } = await params;
    await answerSupportRequest(id, user.id, schema.parse(await request.json()).response);
    return apiSuccess({ answered: true });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/moderation/support/[id]");
  }
}

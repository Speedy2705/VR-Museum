import { apiSuccess } from "@/lib/api-response";
import { requireUserId } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { billingProfileSchema, completeProfileSchema } from "@/lib/validators/user";
import {
  completeUserProfile,
  getBillingProfile,
  updateBillingProfile,
} from "@/server/services/user.service";

export async function GET(request: Request) {
  try {
    return apiSuccess(await getBillingProfile(await requireUserId(request)));
  } catch (error) {
    return handleRouteError(error, "GET /api/profile");
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId(request);
    const input = billingProfileSchema.parse(await request.json());
    return apiSuccess(await updateBillingProfile(userId, input), {
      message: "Billing profile saved",
    });
  } catch (error) {
    return handleRouteError(error, "PUT /api/profile");
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId(request);
    const input = completeProfileSchema.parse(await request.json());
    return apiSuccess(await completeUserProfile(userId, input.role), {
      message: "Profile completed",
    });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/profile");
  }
}

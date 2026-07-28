import { apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { listPublicCollections } from "@/server/services/collection.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess(await listPublicCollections());
  } catch (error) {
    return handleRouteError(error, "GET /api/collections");
  }
}

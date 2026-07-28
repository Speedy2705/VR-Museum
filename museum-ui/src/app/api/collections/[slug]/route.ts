import { apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { collectionSlugSchema } from "@/lib/validators/collection";
import { getCollection } from "@/server/services/collection.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = collectionSlugSchema.parse(await params);
    return apiSuccess(await getCollection(slug));
  } catch (error) {
    return handleRouteError(error, "GET /api/collections/[slug]");
  }
}

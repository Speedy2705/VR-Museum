import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import {
  marketplaceSlugSchema,
  marketplaceUpdateSchema,
} from "@/lib/validators/marketplace";
import {
  deleteMarketplaceListing,
  getMarketplaceListing,
  updateMarketplaceListing,
} from "@/server/services/marketplace.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = marketplaceSlugSchema.parse(await params);
    return apiSuccess(await getMarketplaceListing(slug));
  } catch (error) {
    return handleRouteError(error, "GET /api/marketplace/[slug]");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = marketplaceSlugSchema.parse(await params);
    const input = marketplaceUpdateSchema.parse(await request.json());
    return apiSuccess(
      await updateMarketplaceListing(
        (await requirePermission(request, "sell")).id,
        slug,
        input,
      ),
    );
  } catch (error) {
    return handleRouteError(error, "PATCH /api/marketplace/[slug]");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = marketplaceSlugSchema.parse(await params);
    return apiSuccess(
      await deleteMarketplaceListing(
        (await requirePermission(request, "sell")).id,
        slug,
      ),
    );
  } catch (error) {
    return handleRouteError(error, "DELETE /api/marketplace/[slug]");
  }
}

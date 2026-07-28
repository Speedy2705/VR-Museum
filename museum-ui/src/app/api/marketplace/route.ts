import type { NextRequest } from "next/server";

import { apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { marketplaceQuerySchema } from "@/lib/validators/marketplace";
import { listMarketplace } from "@/server/services/marketplace.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = marketplaceQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return apiSuccess(await listMarketplace(query));
  } catch (error) {
    return handleRouteError(error, "GET /api/marketplace");
  }
}

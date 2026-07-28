import type { NextRequest } from "next/server";

import { apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { artifactListQuerySchema } from "@/lib/validators/artifact";
import { listArtifacts } from "@/server/services/artifact.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const filters = artifactListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return apiSuccess(await listArtifacts(filters));
  } catch (error) {
    return handleRouteError(error, "GET /api/artifacts");
  }
}

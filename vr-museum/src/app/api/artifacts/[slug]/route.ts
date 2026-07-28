import { apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { artifactSlugSchema } from "@/lib/validators/artifact";
import { getArtifact } from "@/server/services/artifact.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = artifactSlugSchema.parse(await params);
    return apiSuccess(await getArtifact(slug));
  } catch (error) {
    return handleRouteError(error, "GET /api/artifacts/[slug]");
  }
}

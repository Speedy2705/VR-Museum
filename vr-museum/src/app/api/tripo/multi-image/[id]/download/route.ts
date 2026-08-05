import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { downloadGeneratedGlb } from "@/server/services/tripo.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(request, "upload");
    const { id } = await params;
    const source = await downloadGeneratedGlb(id);
    return new Response(source.body, {
      headers: {
        "content-type": "model/gltf-binary",
        "content-disposition": `attachment; filename="tripo-${id}.glb"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/tripo/multi-image/[id]/download");
  }
}

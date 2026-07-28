import { apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-error";
import { recordUploadView } from "@/server/services/upload.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await recordUploadView(id);
    return apiSuccess({ recorded: result.count > 0 });
  } catch (error) {
    return handleRouteError(error, "POST /api/uploads/[id]/view");
  }
}

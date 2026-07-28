import { z } from "zod";
import { apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { createArtifactReport } from "@/server/services/report.service";
import { ServiceError } from "@/lib/service-error";

const reportSchema = z.object({
  uploadId: z.string().trim().min(1).optional(),
  artifactSlug: z.string().trim().min(1).optional(),
  reason: z.enum(["copyright", "inaccurate", "offensive", "unsafe", "other"]),
  details: z.string().trim().max(1000).optional(),
}).refine((value) => value.uploadId || value.artifactSlug, { message: "An artifact is required" });

export async function POST(request: Request) {
  try {
    const reporter = await getCurrentUser();
    if (!reporter) throw new ServiceError("Sign in to report an artifact", "UNAUTHORIZED", 401);
    const input = reportSchema.parse(await request.json());
    const report = await createArtifactReport({ ...input, reporterId: reporter.id });
    return apiSuccess({ accepted: true, reportId: report.id }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/reports");
  }
}

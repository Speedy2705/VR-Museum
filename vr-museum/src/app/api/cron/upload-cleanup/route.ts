import { cleanupUploadStorage } from "@/server/services/upload-cleanup.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await cleanupUploadStorage({ dryRun: false });
  return Response.json(result);
}

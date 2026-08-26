import { createB2DownloadUrl } from "@/server/storage/b2";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (process.env.STORAGE_PROVIDER !== "backblaze-b2") {
    return Response.json({ error: "B2 storage is not enabled" }, { status: 404 });
  }
  const key = (await params).key.join("/");
  if (!key.startsWith("uploads/") || key.includes("..")) {
    return Response.json({ error: "Invalid media key" }, { status: 400 });
  }
  return Response.redirect(await createB2DownloadUrl(key), 307);
}

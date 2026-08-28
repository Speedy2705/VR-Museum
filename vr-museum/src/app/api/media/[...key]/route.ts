import { getB2Object } from "@/server/storage/b2";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (process.env.STORAGE_PROVIDER !== "backblaze-b2") {
    return Response.json({ error: "B2 storage is not enabled" }, { status: 404 });
  }
  const key = (await params).key.join("/");
  if (!key.startsWith("uploads/") || key.includes("..")) {
    return Response.json({ error: "Invalid media key" }, { status: 400 });
  }
  try {
    const object = await getB2Object(key, request.headers.get("range"));
    if (!object.Body) return Response.json({ error: "Media object is empty" }, { status: 502 });

    const headers = new Headers({
      "accept-ranges": object.AcceptRanges ?? "bytes",
      "cache-control": object.CacheControl ?? "private, max-age=3600",
      "content-type": object.ContentType ?? "application/octet-stream",
    });
    if (object.ContentLength !== undefined) headers.set("content-length", String(object.ContentLength));
    if (object.ContentRange) headers.set("content-range", object.ContentRange);
    if (object.ETag) headers.set("etag", object.ETag);
    if (object.LastModified) headers.set("last-modified", object.LastModified.toUTCString());

    return new Response(object.Body.transformToWebStream(), {
      status: object.ContentRange ? 206 : 200,
      headers,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") console.error("B2 media proxy failed", { key, error });
    const status = typeof error === "object" && error !== null && "$metadata" in error
      && (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
      ? 404
      : 502;
    return Response.json({ error: status === 404 ? "Media not found" : "Media could not be loaded" }, { status });
  }
}

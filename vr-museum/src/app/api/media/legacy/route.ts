import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

function legacyBlobUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const validHost = url.hostname.endsWith(".public.blob.vercel-storage.com")
      || url.hostname.endsWith(".private.blob.vercel-storage.com");
    return url.protocol === "https:" && validHost && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function responseHeaders(source: { get(name: string): string | null }) {
  const headers = new Headers();
  for (const name of ["accept-ranges", "cache-control", "content-length", "content-range", "content-type", "etag", "last-modified"]) {
    const value = source.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export async function GET(request: Request) {
  const url = legacyBlobUrl(new URL(request.url).searchParams.get("url"));
  if (!url) return Response.json({ error: "Invalid legacy media URL" }, { status: 400 });
  const range = request.headers.get("range");

  // Public legacy stores need no credentials while they remain active.
  const publicResponse = await fetch(url, { headers: range ? { range } : undefined });
  if (publicResponse.ok && publicResponse.body) {
    return new Response(publicResponse.body, { status: publicResponse.status, headers: responseHeaders(publicResponse.headers) });
  }

  // Older stores can become private after a storage migration. When the old
  // store credentials are still configured, the SDK provides a recovery path.
  try {
    const blob = await get(url.href, {
      access: url.hostname.includes(".private.") ? "private" : "public",
      ...(range ? { headers: { range } } : {}),
      ...(process.env.BLOB_READ_WRITE_TOKEN_STORE_ID ? { storeId: process.env.BLOB_READ_WRITE_TOKEN_STORE_ID } : {}),
      ...(process.env.VERCEL_OIDC_TOKEN ? { oidcToken: process.env.VERCEL_OIDC_TOKEN } : {}),
    });
    if (!blob) return Response.json({ error: "Legacy media not found" }, { status: 404 });
    return new Response(blob.stream, { status: blob.headers.get("content-range") ? 206 : 200, headers: responseHeaders(blob.headers) });
  } catch {
    return Response.json({
      error: publicResponse.status === 404 ? "Legacy media not found" : "Legacy Blob credentials are required",
    }, { status: publicResponse.status === 404 ? 404 : 403 });
  }
}

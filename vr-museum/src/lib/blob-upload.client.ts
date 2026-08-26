"use client";

import { uploadPresigned } from "@vercel/blob/client";

export async function uploadMediaDirect(file: File) {
  if (process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "backblaze-b2") {
    const signedResponse = await fetch("/api/b2-upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
    });
    const signed = await signedResponse.json() as {
      uploadUrl?: string;
      url?: string;
      pathname?: string;
      error?: { message?: string };
    };
    if (!signedResponse.ok || !signed.uploadUrl || !signed.url || !signed.pathname) {
      throw new Error(signed.error?.message ?? "Could not authorize the B2 upload");
    }
    const uploadResponse = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error("B2 upload failed");
    return { url: signed.url, pathname: signed.pathname };
  }
  return uploadPresigned(`uploads/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
  });
}

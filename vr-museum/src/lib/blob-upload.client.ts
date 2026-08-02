"use client";

import { uploadPresigned } from "@vercel/blob/client";

export async function uploadMediaDirect(file: File) {
  return uploadPresigned(`uploads/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
  });
}

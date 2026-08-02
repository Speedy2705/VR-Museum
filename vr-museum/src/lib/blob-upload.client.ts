"use client";

import { upload } from "@vercel/blob/client";

export async function uploadMediaDirect(file: File) {
  return upload(`uploads/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
  });
}

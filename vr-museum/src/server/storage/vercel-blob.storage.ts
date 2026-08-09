import { randomUUID } from "node:crypto";
import path from "node:path";
import { del, put } from "@vercel/blob";

import { MAX_UPLOAD_FILE_SIZE } from "@/lib/upload-file-policy";
import type { FileStorage } from "@/server/storage/storage";

export class BlobStorage implements FileStorage {
  async save(file: File) {
    if (!file.size || file.size > MAX_UPLOAD_FILE_SIZE) {
      throw new Error("File must be between 1 byte and 200 MB");
    }

    const extension = path.extname(file.name).replace(/[^.\w-]/g, "");
    const filename = `${randomUUID()}${extension}`;
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
    });

    return {
      url: blob.url,
      filename,
      extension: extension.toLowerCase(),
      contentType: file.type || "application/octet-stream",
      size: file.size,
    };
  }

  async delete(urls: string | string[]) {
    await del(urls);
  }
}

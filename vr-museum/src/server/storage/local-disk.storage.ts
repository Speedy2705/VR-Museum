import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { FileStorage } from "@/server/storage/storage";
import { MAX_UPLOAD_FILE_SIZE } from "@/lib/upload-file-policy";

export class LocalDiskStorage implements FileStorage {
  async save(file: File) {
    if (!file.size || file.size > MAX_UPLOAD_FILE_SIZE) {
      throw new Error("File must be between 1 byte and 150 MB");
    }

    const extension = path.extname(file.name).replace(/[^.\w-]/g, "");
    const filename = `${randomUUID()}${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, filename),
      Buffer.from(await file.arrayBuffer()),
    );

    return {
      url: `/uploads/${filename}`,
      filename,
      extension: extension.toLowerCase(),
      contentType: file.type || "application/octet-stream",
      size: file.size,
    };
  }

  async delete(urls: string | string[]) {
    const values = Array.isArray(urls) ? urls : [urls];
    await Promise.all(values.map(async (url) => {
      if (!url.startsWith("/uploads/")) return;
      const filename = path.basename(url);
      try {
        await unlink(path.join(process.cwd(), "public", "uploads", filename));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }));
  }
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { FileStorage } from "@/server/storage/storage";
import { MAX_UPLOAD_FILE_SIZE } from "@/lib/upload-file-policy";

export class LocalDiskStorage implements FileStorage {
  async save(file: File) {
    if (!file.size || file.size > MAX_UPLOAD_FILE_SIZE) {
      throw new Error("File must be between 1 byte and 200 MB");
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
}

import type { FileStorage } from "@/server/storage/storage";
import { BlobStorage } from "@/server/storage/vercel-blob.storage";
import { LocalDiskStorage } from "@/server/storage/local-disk.storage";

export const fileStorage: FileStorage = process.env.BLOB_READ_WRITE_TOKEN
  ? new BlobStorage()
  : new LocalDiskStorage();

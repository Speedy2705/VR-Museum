import type { FileStorage } from "@/server/storage/storage";
import { BlobStorage } from "@/server/storage/vercel-blob.storage";
import { LocalDiskStorage } from "@/server/storage/local-disk.storage";

const hasBlobStorage = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN_STORE_ID,
);

export const fileStorage: FileStorage = hasBlobStorage
  ? new BlobStorage()
  : new LocalDiskStorage();

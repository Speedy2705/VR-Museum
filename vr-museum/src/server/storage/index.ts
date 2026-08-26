import type { FileStorage } from "@/server/storage/storage";
import { BlobStorage } from "@/server/storage/vercel-blob.storage";
import { LocalDiskStorage } from "@/server/storage/local-disk.storage";
import { B2Storage } from "@/server/storage/b2";

const hasBlobStorage = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN_STORE_ID,
);

export const fileStorage: FileStorage = process.env.STORAGE_PROVIDER === "backblaze-b2"
  ? new B2Storage()
  : hasBlobStorage
    ? new BlobStorage()
    : new LocalDiskStorage();

import type { FileStorage } from "@/server/storage/storage";
import { LocalDiskStorage } from "@/server/storage/local-disk.storage";

// Swap this binding for an S3/Cloudinary implementation in production.
export const fileStorage: FileStorage = new LocalDiskStorage();

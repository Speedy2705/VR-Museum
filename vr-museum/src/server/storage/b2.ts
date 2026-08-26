import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { del as deleteVercelBlob } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { MAX_UPLOAD_FILE_SIZE } from "@/lib/upload-file-policy";
import type { FileStorage } from "@/server/storage/storage";

function required(name: "B2_ENDPOINT" | "B2_REGION" | "B2_ACCESS_KEY_ID" | "B2_SECRET_ACCESS_KEY" | "B2_BUCKET_NAME") {
  const value = process.env[name]?.replace(/\/$/, "");
  if (!value) throw new Error(`${name} is required when STORAGE_PROVIDER=backblaze-b2`);
  return value;
}

export function b2Config() {
  return {
    bucket: required("B2_BUCKET_NAME"),
    client: new S3Client({
      region: required("B2_REGION"),
      endpoint: required("B2_ENDPOINT"),
      credentials: {
        accessKeyId: required("B2_ACCESS_KEY_ID"),
        secretAccessKey: required("B2_SECRET_ACCESS_KEY"),
      },
    }),
  };
}

export function b2ObjectUrl(key: string) {
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function b2KeyFromUrl(url: string) {
  const pathname = new URL(url, "http://museum.local").pathname;
  if (!pathname.startsWith("/api/media/")) return null;
  return decodeURIComponent(pathname.slice("/api/media/".length));
}

export function createB2ObjectKey(filename: string) {
  const extension = path.extname(filename).replace(/[^.\w-]/g, "").toLowerCase();
  return `uploads/${randomUUID()}${extension}`;
}

export async function createB2UploadUrl(key: string, contentType: string) {
  const { bucket, client } = b2Config();
  return getSignedUrl(client, new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  }), { expiresIn: 15 * 60 });
}

export async function createB2DownloadUrl(key: string) {
  const { bucket, client } = b2Config();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: 60 * 60,
  });
}

export async function listB2UploadObjects() {
  const { bucket, client } = b2Config();
  const objects: Array<{ url: string; pathname: string; size: number; uploadedAt: Date }> = [];
  let continuationToken: string | undefined;
  do {
    const page = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "uploads/",
      ContinuationToken: continuationToken,
    }));
    for (const object of page.Contents ?? []) {
      if (!object.Key || !object.LastModified) continue;
      objects.push({
        url: b2ObjectUrl(object.Key),
        pathname: object.Key,
        size: object.Size ?? 0,
        uploadedAt: object.LastModified,
      });
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

export class B2Storage implements FileStorage {
  async save(file: File) {
    if (!file.size || file.size > MAX_UPLOAD_FILE_SIZE) {
      throw new Error("File must be between 1 byte and 150 MB");
    }
    const key = createB2ObjectKey(file.name);
    const { bucket, client } = b2Config();
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || "application/octet-stream",
    }));
    return {
      url: b2ObjectUrl(key),
      filename: path.basename(key),
      extension: path.extname(key).toLowerCase(),
      contentType: file.type || "application/octet-stream",
      size: file.size,
    };
  }

  async delete(urls: string | string[]) {
    const values = Array.isArray(urls) ? urls : [urls];
    const keys = values
      .map(b2KeyFromUrl)
      .filter((key): key is string => Boolean(key));
    if (keys.length) {
      const { bucket, client } = b2Config();
      await client.send(new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }));
    }
    const legacyBlobUrls = values.filter((url) => {
      try {
        return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
      } catch {
        return false;
      }
    });
    if (legacyBlobUrls.length) {
      await deleteVercelBlob(legacyBlobUrls, process.env.BLOB_READ_WRITE_TOKEN_STORE_ID
        ? { storeId: process.env.BLOB_READ_WRITE_TOKEN_STORE_ID }
        : {});
    }
  }
}

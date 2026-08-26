import { config } from "dotenv";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { b2Config } = await import("../src/server/storage/b2");
const { bucket, client } = b2Config();
const key = `uploads/_connection-test/${randomUUID()}.txt`;

await client.send(new HeadBucketCommand({ Bucket: bucket }));
await client.send(new PutBucketCorsCommand({
  Bucket: bucket,
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: [
        "http://localhost:3000",
        "https://viswaroop.iiitdmj.ac.in",
        "https://*.vercel.app",
      ],
      AllowedHeaders: ["content-type"],
      AllowedMethods: ["GET", "HEAD", "PUT"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    }],
  },
}));

try {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: "vr-museum B2 connection test",
    ContentType: "text/plain",
  }));
  const downloadUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 60 },
  );
  const response = await fetch(downloadUrl);
  if (!response.ok || await response.text() !== "vr-museum B2 connection test") {
    throw new Error(`Signed B2 download verification failed (${response.status})`);
  }
  console.log(JSON.stringify({ bucketReachable: true, corsConfigured: true, signedUploadVerified: true, signedDownloadVerified: true }));
} finally {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";

import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import { MAX_UPLOAD_FILE_SIZE } from "@/lib/upload-file-policy";

export const dynamic = "force-dynamic";

const allowedContentTypes = [
  "application/gltf+json",
  "application/json",
  "application/octet-stream",
  "application/sla",
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "model/gltf-binary",
  "model/obj",
  "model/stl",
  "text/plain",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export async function POST(request: Request) {
  try {
    const user = await requirePermission(request, "upload");
    const body = (await request.json()) as HandleUploadPresignedBody;
    const storeId = process.env.BLOB_READ_WRITE_TOKEN_STORE_ID;
    const webhookPublicKey = process.env.BLOB_READ_WRITE_TOKEN_WEBHOOK_PUBLIC_KEY;
    if (!storeId || !webhookPublicKey) {
      throw new Error("Vercel Blob OIDC connection variables are missing");
    }
    const response = await handleUploadPresigned({
      body,
      request,
      webhookPublicKey,
      getSignedToken: async (pathname) => ({
        token: await issueSignedToken({
          storeId,
          pathname,
          operations: ["put"],
          allowedContentTypes,
          maximumSizeInBytes: MAX_UPLOAD_FILE_SIZE,
        }),
        urlOptions: {
          access: "public",
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        },
      }),
      onUploadCompleted: async () => {
        // The artifact record is created after both media files finish uploading.
      },
    });
    return Response.json(response);
  } catch (error) {
    return handleRouteError(error, "POST /api/blob-upload");
  }
}

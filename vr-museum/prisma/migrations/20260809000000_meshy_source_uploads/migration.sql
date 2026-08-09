CREATE TABLE "MeshySourceUpload" (
    "taskId" TEXT NOT NULL,
    "blobUrls" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleanedAt" TIMESTAMP(3),

    CONSTRAINT "MeshySourceUpload_pkey" PRIMARY KEY ("taskId")
);

CREATE INDEX "MeshySourceUpload_cleanedAt_idx" ON "MeshySourceUpload"("cleanedAt");

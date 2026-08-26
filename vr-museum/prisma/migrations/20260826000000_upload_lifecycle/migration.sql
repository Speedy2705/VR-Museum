ALTER TABLE "UploadedAsset"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "UploadedAsset_status_reviewedAt_idx"
ON "UploadedAsset"("status", "reviewedAt");

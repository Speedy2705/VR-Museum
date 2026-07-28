CREATE TABLE "ArtifactReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT,
    "artifactTitle" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "reporterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolvedById" TEXT,
    CONSTRAINT "ArtifactReport_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "UploadedAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ArtifactReport_status_createdAt_idx" ON "ArtifactReport"("status", "createdAt");
CREATE INDEX "ArtifactReport_uploadId_idx" ON "ArtifactReport"("uploadId");

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "response" TEXT,
    "respondedAt" DATETIME,
    "respondedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SupportRequest_requesterId_createdAt_idx" ON "SupportRequest"("requesterId", "createdAt");
CREATE INDEX "SupportRequest_status_createdAt_idx" ON "SupportRequest"("status", "createdAt");

-- SQLite requires a table rebuild to remove a column.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UploadedAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'MODEL_3D',
    "modelFormat" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UploadedAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UploadedAsset" ("category", "fileUrl", "id", "mediaType", "metadata", "modelFormat", "ownerId", "status", "thumbnailUrl", "title", "views") SELECT "category", "fileUrl", "id", "mediaType", "metadata", "modelFormat", "ownerId", "status", "thumbnailUrl", "title", "views" FROM "UploadedAsset";
DROP TABLE "UploadedAsset";
ALTER TABLE "new_UploadedAsset" RENAME TO "UploadedAsset";
CREATE UNIQUE INDEX "UploadedAsset_ownerId_title_key" ON "UploadedAsset"("ownerId", "title");
CREATE INDEX "UploadedAsset_ownerId_idx" ON "UploadedAsset"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

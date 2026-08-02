-- RedefineTable
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
    "lightingPreset" TEXT,
    "curatorComment" TEXT,
    "curatorId" TEXT,
    "reviewedAt" DATETIME,
    "collectionSlug" TEXT,
    "metadata" JSONB NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UploadedAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UploadedAsset_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UploadedAsset" ("category", "fileUrl", "id", "mediaType", "metadata", "modelFormat", "ownerId", "status", "thumbnailUrl", "title", "views")
SELECT "category", "fileUrl", "id", "mediaType", "metadata", "modelFormat", "ownerId", "status", "thumbnailUrl", "title", "views" FROM "UploadedAsset";
DROP TABLE "UploadedAsset";
ALTER TABLE "new_UploadedAsset" RENAME TO "UploadedAsset";
CREATE UNIQUE INDEX "UploadedAsset_ownerId_title_key" ON "UploadedAsset"("ownerId", "title");
CREATE INDEX "UploadedAsset_ownerId_idx" ON "UploadedAsset"("ownerId");
CREATE INDEX "UploadedAsset_curatorId_idx" ON "UploadedAsset"("curatorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

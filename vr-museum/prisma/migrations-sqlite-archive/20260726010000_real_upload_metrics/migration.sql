ALTER TABLE "UploadedAsset" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UploadedAsset" ADD COLUMN "downloads" INTEGER NOT NULL DEFAULT 0;

UPDATE "UploadedAsset"
SET "views" = COALESCE(CAST(json_extract("metadata", '$.views') AS INTEGER), 0),
    "downloads" = COALESCE(CAST(json_extract("metadata", '$.downloads') AS INTEGER), 0);

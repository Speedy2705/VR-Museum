-- CreateIndex
CREATE UNIQUE INDEX "UploadedAsset_ownerId_title_key" ON "UploadedAsset"("ownerId", "title");

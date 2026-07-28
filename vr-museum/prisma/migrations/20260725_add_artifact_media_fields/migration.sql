-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "Artifact" ADD COLUMN "modelUrl" TEXT;
ALTER TABLE "Artifact" ADD COLUMN "modelFormat" TEXT;
ALTER TABLE "Artifact" ADD COLUMN "primaryMediaType" TEXT NOT NULL DEFAULT 'IMAGE';

-- AlterTable
ALTER TABLE "UploadedAsset" ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'MODEL_3D';
ALTER TABLE "UploadedAsset" ADD COLUMN "modelFormat" TEXT;

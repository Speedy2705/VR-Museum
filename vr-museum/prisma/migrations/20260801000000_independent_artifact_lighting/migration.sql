ALTER TABLE "UploadedAsset" ADD COLUMN "lightTemperature" TEXT;
ALTER TABLE "UploadedAsset" ADD COLUMN "lightDirection" TEXT;

UPDATE "UploadedAsset" SET "lightTemperature" = CASE
  WHEN "lightingPreset" = 'warm-diffuse' THEN 'warm-white'
  WHEN "lightingPreset" = 'cool-ambient' THEN 'artificial-daylight'
  ELSE 'cool-white' END
WHERE "mediaType" = 'MODEL_3D';

UPDATE "Collection" SET "slug"='veins-of-marble', "title"='Veins of Marble', "subtitle"='Form revealed in luminous stone', "description"='Carved marble sculptures and timeless decorative works', "category"='Marble' WHERE "slug"='remnants-of-stone';
UPDATE "Collection" SET "slug"='forged-in-time', "title"='Forged in Time', "subtitle"='Metal shaped by ritual, craft, and history', "description"='Metal artifacts, ritual objects, ornaments, and historic craftsmanship', "category"='Metal' WHERE "slug"='bronze-ritual';
UPDATE "Collection" SET "slug"='stories-in-color', "title"='Stories in Color', "subtitle"='Culture and memory carried through colour', "description"='Paintings preserving culture, imagination, and moments in time', "category"='Painting' WHERE "slug"='light-through-glass';
UPDATE "Collection" SET "slug"='earth-and-ember', "title"='Earth & Ember', "subtitle"='Earthen forms born from hand and flame', "description"='Red-clay pottery, terracotta figures, and hand-shaped earthen works', "category"='Terracotta' WHERE "slug"='earth-fire';
INSERT OR IGNORE INTO "Collection" ("id", "slug", "title", "subtitle", "description", "heroImage", "category") VALUES ('echoes-in-stone', 'echoes-in-stone', 'Echoes in Stone', 'Marks, inscriptions, and weathered memory', 'Carved stone sculptures, inscriptions, and weathered fragments', '', 'Stone');

UPDATE "UploadedAsset" SET "category"='veins-of-marble', "collectionSlug"='veins-of-marble' WHERE "category"='remnants-of-stone' OR "collectionSlug"='remnants-of-stone';
UPDATE "UploadedAsset" SET "category"='forged-in-time', "collectionSlug"='forged-in-time' WHERE "category"='bronze-ritual' OR "collectionSlug"='bronze-ritual';
UPDATE "UploadedAsset" SET "category"='stories-in-color', "collectionSlug"='stories-in-color' WHERE "category"='light-through-glass' OR "collectionSlug"='light-through-glass';
UPDATE "UploadedAsset" SET "category"='earth-and-ember', "collectionSlug"='earth-and-ember' WHERE "category"='earth-fire' OR "collectionSlug"='earth-fire';

UPDATE "UploadedAsset" SET "lightDirection" = CASE
  WHEN "lightingPreset" = 'directional-spot' THEN 'spotlight'
  WHEN "lightingPreset" = 'raking-light' THEN 'raking-light'
  WHEN "lightingPreset" = 'backlit-halo' THEN 'backlight'
  ELSE 'front-facing' END
WHERE "mediaType" = 'MODEL_3D';

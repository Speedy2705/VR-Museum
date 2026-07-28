-- SQLite stores Prisma enum values as TEXT. Normalize legacy roles while the
-- Prisma schema adds REJECTED to AssetStatus for moderation decisions.
UPDATE "User"
SET "role" = 'VISITOR'
WHERE "role" IN ('USER', 'ADMIN');

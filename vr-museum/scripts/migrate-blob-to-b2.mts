import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const apply = process.argv.includes("--apply");
const { del } = await import("@vercel/blob");
const { prisma } = await import("../src/lib/prisma");
const { B2Storage } = await import("../src/server/storage/b2");

const uploads = await prisma.uploadedAsset.findMany({
  select: { id: true, title: true, fileUrl: true, thumbnailUrl: true },
});
const candidates = uploads.flatMap((upload) => [
  { upload, field: "fileUrl" as const, url: upload.fileUrl },
  ...(upload.thumbnailUrl ? [{ upload, field: "thumbnailUrl" as const, url: upload.thumbnailUrl }] : []),
]).filter(({ url }) => {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
});

console.log(JSON.stringify({
  dryRun: !apply,
  objects: candidates.map(({ upload, field, url }) => ({ uploadId: upload.id, title: upload.title, field, url })),
}, null, 2));

if (!apply) {
  console.log("Dry run only. Configure B2, review the list, then re-run with --apply.");
  await prisma["$disconnect"]();
  process.exit(0);
}

const storage = new B2Storage();
for (const candidate of candidates) {
  const response = await fetch(candidate.url);
  if (!response.ok) throw new Error(`Could not download ${candidate.url}: ${response.status}`);
  const filename = decodeURIComponent(new URL(candidate.url).pathname.split("/").pop() ?? "media.bin");
  const file = new File([await response.arrayBuffer()], filename, {
    type: response.headers.get("content-type") ?? "application/octet-stream",
  });
  const stored = await storage.save(file);
  await prisma.$transaction(async (transaction) => {
    await transaction.uploadedAsset.update({
      where: { id: candidate.upload.id },
      data: { [candidate.field]: stored.url },
    });
    if (candidate.field === "fileUrl") {
      await transaction.artifact.updateMany({
        where: { OR: [{ modelUrl: candidate.url }, { videoUrl: candidate.url }] },
        data: candidate.url.toLowerCase().split(/[?#]/)[0].match(/\.(mp4|mov|webm)$/)
          ? { videoUrl: stored.url }
          : { modelUrl: stored.url },
      });
    } else {
      await transaction.artifact.updateMany({ where: { image: candidate.url }, data: { image: stored.url } });
      await transaction.collection.updateMany({ where: { heroImage: candidate.url }, data: { heroImage: stored.url } });
    }
  });
  await del(candidate.url, process.env.BLOB_READ_WRITE_TOKEN_STORE_ID
    ? { storeId: process.env.BLOB_READ_WRITE_TOKEN_STORE_ID }
    : {});
  console.log(`Migrated ${candidate.field} for ${candidate.upload.id}`);
}

await prisma["$disconnect"]();

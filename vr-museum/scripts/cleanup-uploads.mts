import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const apply = process.argv.includes("--apply");
const { cleanupUploadStorage } = await import("../src/server/services/upload-cleanup.service");
const result = await cleanupUploadStorage({ dryRun: !apply });
console.log(JSON.stringify(result, null, 2));

if (!apply) {
  console.log("Dry run only. Re-run with --apply after reviewing every listed object.");
}

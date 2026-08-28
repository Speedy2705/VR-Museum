import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { validateModelPayload } from "../src/lib/three/model-integrity";
import type { ModelFormat } from "../src/lib/three/loaders";

const { prisma } = await import("../src/lib/prisma");
const baseUrl = (process.env.MODEL_AUDIT_BASE_URL ?? process.env.AUTH_URL)?.replace(/\/$/, "");
if (!baseUrl) throw new Error("Set MODEL_AUDIT_BASE_URL or AUTH_URL to the deployed site origin");

const [uploads, artifacts] = await Promise.all([
  prisma.uploadedAsset.findMany({ where: { mediaType: "MODEL_3D", status: "APPROVED" }, select: { id: true, title: true, fileUrl: true, modelFormat: true } }),
  prisma.artifact.findMany({ where: { modelUrl: { not: null } }, select: { id: true, title: true, modelUrl: true, modelFormat: true } }),
]);
const models = [
  ...uploads.map((model) => ({ ...model, url: model.fileUrl })),
  ...artifacts.map((model) => ({ ...model, url: model.modelUrl! })),
];
let failures = 0;
for (const model of models) {
  const format = model.modelFormat as ModelFormat | null;
  try {
    if (!format || !["glb", "gltf", "obj", "stl"].includes(format)) throw new Error(`Unsupported or missing format: ${format ?? "none"}`);
    const response = await fetch(new URL(model.url, baseUrl), { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    validateModelPayload(format, new Uint8Array(await response.arrayBuffer()));
    console.log(`OK   ${model.id}  ${model.title}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${model.id}  ${model.title}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
await prisma.$disconnect();
console.log(`Audited ${models.length} models; ${failures} failed.`);
if (failures) process.exitCode = 1;

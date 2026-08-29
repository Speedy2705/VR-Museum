import * as THREE from "three";
import type { LightingPresetKey } from "@/lib/artifact-categories";
import { getLightingPreset } from "@/lib/lighting-presets";

export type ModelFormat = "glb" | "gltf" | "obj" | "stl";
export type ModelLoadError = { code: "UNSUPPORTED" | "LOAD_FAILED"; message: string };

function reject(code: ModelLoadError["code"], message: string): never {
  throw { code, message } satisfies ModelLoadError;
}

function failureMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  if (/404|not found/i.test(detail)) return "The model file was not found in storage.";
  if (/403|forbidden|access denied/i.test(detail)) return "Storage denied access to this model file.";
  if (/failed to fetch|networkerror|cors/i.test(detail)) return "The model could not be downloaded from storage.";
  if (/draco/i.test(detail)) return "The model uses Draco compression but could not be decoded.";
  if (/meshopt/i.test(detail)) return "The model uses Meshopt compression but could not be decoded.";
  if (/json|buffer|glb|gltf|parse|unexpected/i.test(detail)) return "The downloaded model file is incomplete or invalid.";
  return "The model file could not be loaded or decoded.";
}

let textureConsoleFilterDepth = 0;
let originalConsoleError: typeof console.error | null = null;

function beginTextureConsoleFilter() {
  textureConsoleFilterDepth++;
  if (textureConsoleFilterDepth !== 1) return;
  originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("THREE.GLTFLoader: Couldn't load texture")) return;
    originalConsoleError?.(...args);
  };
}

function endTextureConsoleFilter() {
  textureConsoleFilterDepth = Math.max(0, textureConsoleFilterDepth - 1);
  if (textureConsoleFilterDepth === 0 && originalConsoleError) {
    console.error = originalConsoleError;
    originalConsoleError = null;
  }
}

function fallbackMaterial(presetKey: LightingPresetKey) {
  const hint = getLightingPreset(presetKey).fallbackMaterial;
  return new THREE.MeshStandardMaterial({ ...hint });
}

function modelRequestUrl(url: string) {
  const resolved = new URL(url, window.location.href);
  if (resolved.hostname.endsWith(".public.blob.vercel-storage.com") || resolved.hostname.endsWith(".private.blob.vercel-storage.com")) {
    return new URL(`/api/media/legacy?url=${encodeURIComponent(resolved.href)}`, window.location.origin);
  }
  return resolved;
}

export function modelResourceBaseUrl(resolvedUrl: URL, pageUrl: string) {
  // Object URLs have opaque paths and cannot be used as a base URL. Generated
  // previews are self-contained GLBs, so use the current page for the loader's
  // resource path while GLTFLoader resolves embedded buffers internally.
  if (resolvedUrl.protocol === "blob:") return new URL(".", pageUrl).href;
  return new URL(".", resolvedUrl).href;
}

export async function loadModel(url: string, format: ModelFormat, presetKey: LightingPresetKey = "warm-diffuse"): Promise<THREE.Object3D> {
  try {
    if (format === "glb" || format === "gltf") {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const [{ DRACOLoader }, { MeshoptDecoder }] = await Promise.all([
        import("three/examples/jsm/loaders/DRACOLoader.js"),
        import("three/examples/jsm/libs/meshopt_decoder.module.js"),
      ]);
      const draco = new DRACOLoader().setDecoderPath("/draco/");
      const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
      const resolvedUrl = modelRequestUrl(url);
      const response = await fetch(resolvedUrl);
      if (!response.ok) throw new Error(`Model request returned HTTP ${response.status}`);
      const payload = format === "glb" ? await response.arrayBuffer() : await response.text();
      beginTextureConsoleFilter();
      try {
        return (await loader.parseAsync(payload, modelResourceBaseUrl(resolvedUrl, window.location.href))).scene;
      } finally {
        endTextureConsoleFilter();
        draco.dispose();
      }
    }
    if (format === "obj") {
      const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
      const object = await new OBJLoader().loadAsync(url);
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = fallbackMaterial(presetKey);
          child.userData.usesPresetFallbackMaterial = true;
        }
      });
      return object;
    }
    if (format === "stl") {
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const mesh = new THREE.Mesh(await new STLLoader().loadAsync(url), fallbackMaterial(presetKey));
      mesh.userData.usesPresetFallbackMaterial = true;
      return mesh;
    }
    return reject("UNSUPPORTED", "This 3D model format is not supported.");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) throw error;
    return reject("LOAD_FAILED", failureMessage(error));
  }
}

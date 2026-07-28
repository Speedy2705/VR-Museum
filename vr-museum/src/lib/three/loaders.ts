import * as THREE from "three";
import type { LightingPresetKey } from "@/lib/artifact-categories";
import { getLightingPreset } from "@/lib/lighting-presets";

export type ModelFormat = "glb" | "gltf" | "obj" | "stl";
export type ModelLoadError = { code: "UNSUPPORTED" | "LOAD_FAILED"; message: string };

const failedMessage = "The model file may be missing or no longer available.";

function reject(code: ModelLoadError["code"], message: string): never {
  throw { code, message } satisfies ModelLoadError;
}

function fallbackMaterial(presetKey: LightingPresetKey) {
  const hint = getLightingPreset(presetKey).fallbackMaterial;
  return new THREE.MeshStandardMaterial({ ...hint });
}

export async function loadModel(url: string, format: ModelFormat, presetKey: LightingPresetKey = "warm-diffuse"): Promise<THREE.Object3D> {
  try {
    if (format === "glb" || format === "gltf") {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      return (await new GLTFLoader().loadAsync(url)).scene;
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
    return reject("LOAD_FAILED", failedMessage);
  }
}

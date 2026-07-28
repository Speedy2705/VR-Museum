import * as THREE from "three";
import type { LightingPresetKey } from "@/lib/artifact-categories";

export type FallbackMaterialHint = { color: THREE.ColorRepresentation; metalness: number; roughness: number; transparent?: boolean; opacity?: number };
export type LightingPreset = { key: LightingPresetKey; name: string; description: string; build: (scene: THREE.Scene) => THREE.Light[]; fallbackMaterial: FallbackMaterialHint };

function addLights(scene: THREE.Scene, lights: THREE.Light[]) {
  scene.add(...lights);
  return lights;
}

export const LIGHTING_PRESETS = [
  {
    key: "warm-diffuse", name: "Warm Diffuse",
    description: "A broad, soft amber source from above. Eliminates harsh shadow and shows the warmth of fired clay surfaces.",
    build: (scene) => { const key = new THREE.DirectionalLight(0xffc980, 2.5); key.position.set(2, 5, 3); return addLights(scene, [new THREE.HemisphereLight(0xffe0b2, 0x4a3024, 1.8), key]); },
    fallbackMaterial: { color: 0xb87345, metalness: 0.05, roughness: 0.78 },
  },
  {
    key: "directional-spot", name: "Directional Spot",
    description: "A narrow, high-intensity key light at 45°. Creates specular highlights that reveal cast surface texture on metal.",
    build: (scene) => { const spot = new THREE.SpotLight(0xffe2ad, 7, 0, Math.PI / 7, 0.3, 1.2); spot.position.set(4, 5, 4); return addLights(scene, [new THREE.AmbientLight(0x302b27, 0.7), spot]); },
    fallbackMaterial: { color: 0x8c6239, metalness: 0.82, roughness: 0.3 },
  },
  {
    key: "cool-ambient", name: "Cool Ambient",
    description: "A diffuse, bluish fill matching the colour temperature of overcast northern daylight — ideal for pale stone.",
    build: (scene) => { const key = new THREE.DirectionalLight(0xe4edff, 1.2); key.position.set(-3, 4, 2); return addLights(scene, [new THREE.HemisphereLight(0xc9dcff, 0x657080, 2.2), key]); },
    fallbackMaterial: { color: 0xd8d5cc, metalness: 0, roughness: 0.72 },
  },
  {
    key: "backlit-halo", name: "Backlit Halo",
    description: "A translucent rim source behind the artifact. Light passes through the material, revealing internal colour.",
    build: (scene) => { const back = new THREE.PointLight(0x7fdcff, 8, 20, 1.5); back.position.set(0, 2, -4); const rim = new THREE.DirectionalLight(0xb9efff, 2.5); rim.position.set(-3, 3, -2); return addLights(scene, [new THREE.AmbientLight(0x172536, 0.65), back, rim]); },
    fallbackMaterial: { color: 0x5fc7d6, metalness: 0.05, roughness: 0.18, transparent: true, opacity: 0.62 },
  },
  {
    key: "raking-light", name: "Raking Light",
    description: "A low-angle grazing light at 10–15° from the surface. Makes incised marks and surface texture legible.",
    build: (scene) => { const rake = new THREE.DirectionalLight(0xffd7a3, 4.5); rake.position.set(5, 0.8, 2); return addLights(scene, [new THREE.AmbientLight(0x28231f, 0.55), rake]); },
    fallbackMaterial: { color: 0x756a5d, metalness: 0.08, roughness: 0.9 },
  },
] as const satisfies readonly LightingPreset[];

export const FALLBACK_MATERIAL_HINTS = Object.fromEntries(LIGHTING_PRESETS.map(({ key, fallbackMaterial }) => [key, fallbackMaterial])) as Record<LightingPresetKey, FallbackMaterialHint>;
export function getLightingPreset(key: LightingPresetKey) { return LIGHTING_PRESETS.find((preset) => preset.key === key)!; }

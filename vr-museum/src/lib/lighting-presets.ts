import * as THREE from "three";
import type { LightDirectionKey, LightTemperatureKey, LightingPresetKey } from "@/lib/artifact-categories";

export const LIGHT_TEMPERATURES = [
  { key: "warm-white", name: "Warm White", kelvin: 3000, description: "A welcoming amber-white glow that enriches clay, wood, aged finishes, and warm pigments." },
  { key: "cool-white", name: "Cool White", kelvin: 4000, description: "A balanced, neutral-white light that preserves colour while keeping metalwork and painted detail crisp." },
  { key: "artificial-daylight", name: "Artificial Daylight", kelvin: 5000, description: "A clean daylight simulation that reveals pale stone, marble veining, inscriptions, and subtle surface variation." },
] as const;

export const LIGHT_DIRECTIONS = [
  { key: "spotlight", name: "Spotlight", description: "A focused beam from above and to one side, creating dramatic emphasis and bright highlights on a chosen feature." },
  { key: "top-light", name: "Top Light", description: "Light falling vertically from above, defining the crown and upper contours while grounding the artifact with shadow." },
  { key: "front-facing", name: "Front-Facing Light", description: "Even illumination from the viewer’s direction, ideal for clearly reading colour, form, and documentary detail." },
  { key: "raking-light", name: "Raking Light", description: "A low grazing beam that stretches shadows across the surface to reveal carving, tool marks, cracks, and inscriptions." },
  { key: "backlight", name: "Backlight", description: "Light placed behind the artifact to outline its silhouette and reveal translucency in glass or thin materials." },
] as const;

export function getLightTemperature(key: LightTemperatureKey) { return LIGHT_TEMPERATURES.find((item) => item.key === key)!; }
export function getLightDirection(key: LightDirectionKey) { return LIGHT_DIRECTIONS.find((item) => item.key === key)!; }

const colours: Record<LightTemperatureKey, number> = { "warm-white": 0xffc58f, "cool-white": 0xfff4e5, "artificial-daylight": 0xe7f2ff };
export function buildLighting(scene: THREE.Scene, temperature: LightTemperatureKey, direction: LightDirectionKey, target = new THREE.Vector3()) {
  const color = colours[temperature];
  const temperatureBoost = temperature === "warm-white" ? 1.2 : temperature === "cool-white" ? 1.12 : 1;
  const ambient = new THREE.HemisphereLight(color, 0x292725, (direction === "front-facing" ? 2.35 : 1.15) * temperatureBoost);
  ambient.layers.set(1);
  ambient.userData.artifactLight = true;
  let key: THREE.Light;
  const lightTarget = new THREE.Object3D();
  lightTarget.name = "artifact-light-target";
  lightTarget.position.copy(target);
  if (direction === "spotlight") { const light = new THREE.SpotLight(color, 10 * temperatureBoost, 0, Math.PI / 6, .3, 1.2); light.position.copy(target).add(new THREE.Vector3(0.75, 2.15, 1.45)); light.target = lightTarget; key = light; }
  else { const light = new THREE.DirectionalLight(color, (direction === "front-facing" ? 5.5 : 7) * temperatureBoost); const offset = direction === "top-light" ? [0, 6, 0.5] : direction === "raking-light" ? [6, .7, 2] : direction === "backlight" ? [0, 3, -5] : [0, 2.5, 6]; light.position.copy(target).add(new THREE.Vector3(...offset as [number, number, number])); light.target = lightTarget; key = light; }
  key.layers.set(1);
  key.userData.artifactLight = true;
  scene.add(lightTarget);
  scene.add(ambient, key); return [ambient, key];
}

const legacyMap: Record<LightingPresetKey, { temperature: LightTemperatureKey; direction: LightDirectionKey; name: string }> = {
  "warm-diffuse": { temperature: "warm-white", direction: "front-facing", name: "Warm Diffuse" },
  "directional-spot": { temperature: "cool-white", direction: "spotlight", name: "Directional Spot" },
  "cool-ambient": { temperature: "artificial-daylight", direction: "front-facing", name: "Cool Ambient" },
  "backlit-halo": { temperature: "cool-white", direction: "backlight", name: "Backlit Halo" },
  "raking-light": { temperature: "cool-white", direction: "raking-light", name: "Raking Light" },
};
export function getLightingPreset(key: LightingPresetKey) { const item = legacyMap[key]; return { key, name: item.name, description: getLightDirection(item.direction).description, build: (scene: THREE.Scene, target?: THREE.Vector3) => buildLighting(scene, item.temperature, item.direction, target), fallbackMaterial: { color: 0xaaa49a, metalness: .1, roughness: .65 } }; }
export function keyFromDisplayName(name: string | null | undefined): LightingPresetKey { const normalized = name?.toLowerCase() ?? ""; return (Object.keys(legacyMap) as LightingPresetKey[]).find((key) => key === normalized || legacyMap[key].name.toLowerCase() === normalized) ?? "raking-light"; }
export const LIGHTING_PRESETS = (Object.keys(legacyMap) as LightingPresetKey[]).map(getLightingPreset);

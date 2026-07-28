export type CollectionSlug = "bronze-ritual" | "earth-fire" | "light-through-glass" | "remnants-of-stone" | "community-uploads";
export type LightingPresetKey = "warm-diffuse" | "directional-spot" | "cool-ambient" | "backlit-halo" | "raking-light";

export const ARTIFACT_CATEGORIES = [
  { key: "bronze-ritual", name: "Bronze & Ritual", lightingPreset: "directional-spot" },
  { key: "earth-fire", name: "Earth & Fire", lightingPreset: "warm-diffuse" },
  { key: "light-through-glass", name: "Light Through Glass", lightingPreset: "backlit-halo" },
  { key: "remnants-of-stone", name: "Remnants of Stone", lightingPreset: "cool-ambient" },
  { key: "community-uploads", name: "Community Uploads", lightingPreset: "raking-light" },
] as const satisfies readonly { key: CollectionSlug; name: string; lightingPreset: LightingPresetKey }[];

export function getCategoryByKey(key: CollectionSlug) {
  return ARTIFACT_CATEGORIES.find((category) => category.key === key);
}

export function getDefaultLightingForCategory(key: CollectionSlug): LightingPresetKey {
  return getCategoryByKey(key)!.lightingPreset;
}

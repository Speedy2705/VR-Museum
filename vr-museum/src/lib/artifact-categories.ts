export type CollectionSlug = "veins-of-marble" | "forged-in-time" | "stories-in-color" | "echoes-in-stone" | "earth-and-ember" | "community-uploads";
export type LightTemperatureKey = "warm-white" | "cool-white" | "artificial-daylight";
export type LightDirectionKey = "spotlight" | "top-light" | "front-facing" | "raking-light" | "backlight";
/** @deprecated Compatibility for catalog records created before lighting was separated. */
export type LightingPresetKey = "warm-diffuse" | "directional-spot" | "cool-ambient" | "backlit-halo" | "raking-light";
export type ExhibitDisplayStyle = "sculpture" | "framed-art";

export const ARTIFACT_CATEGORIES = [
  { key: "veins-of-marble", name: "Veins of Marble", description: "Carved marble sculptures and timeless decorative works", lightTemperature: "artificial-daylight" },
  { key: "forged-in-time", name: "Forged in Time", description: "Metal artifacts, ritual objects, ornaments, and historic craftsmanship", lightTemperature: "cool-white" },
  { key: "stories-in-color", name: "Stories in Color", description: "Paintings and textiles preserving cultural memory through pigment, pattern, surface, craft, and narrative", lightTemperature: "cool-white" },
  { key: "echoes-in-stone", name: "Echoes in Stone", description: "Carved stone sculptures, inscriptions, and weathered fragments", lightTemperature: "artificial-daylight" },
  { key: "earth-and-ember", name: "Earth & Ember", description: "Red-clay pottery, terracotta figures, and hand-shaped earthen works", lightTemperature: "cool-white" },
  { key: "community-uploads", name: "Community Uploads", description: "Artifacts beyond the five galleries, shared for curatorial review and public discovery", lightTemperature: "cool-white" },
] as const satisfies readonly { key: CollectionSlug; name: string; description: string; lightTemperature: LightTemperatureKey }[];

export function getCategoryByKey(key: CollectionSlug) { return ARTIFACT_CATEGORIES.find((category) => category.key === key); }
export function getDefaultTemperatureForCategory(key: CollectionSlug): LightTemperatureKey { return getCategoryByKey(key)!.lightTemperature; }
export function getDefaultDirectionForCategory(key: CollectionSlug): LightDirectionKey { void key; return "front-facing"; }
export function getExhibitDisplayStyle(category?: string | null, material?: string | null): ExhibitDisplayStyle {
  const description = `${category ?? ""} ${material ?? ""}`.toLowerCase();
  return /stories[-\s]in[-\s]colo(?:u)?r|painting|textile|fabric|batik|screen print|block print|canvas/.test(description)
    ? "framed-art"
    : "sculpture";
}
/** @deprecated Use independent temperature and direction defaults. */
export function getDefaultLightingForCategory(key: CollectionSlug): LightingPresetKey { return getDefaultTemperatureForCategory(key) === "artificial-daylight" ? "cool-ambient" : "directional-spot"; }

/** Page-level hero and section backgrounds (from Website pngs / UI.png). */
export const pageImages = {
  heroGallery: "/images/hero-gallery.png",
  heroVrBanner: "/images/hero-vr-banner.png",
  galleryInterior: "/images/gallery-interior.png",
  vrPerson: "/images/vr-person.png",
  vrHeadset: "/images/vr-headset.png",
  galleryVisitor: "/images/gallery-visitor.png",
  marketplaceHero: "/images/marketplace-hero.png",
  galleryWall: "/images/gallery-wall.png",
  galleryPanorama: "/images/gallery-panorama.png",
  studioBackground: "/images/studio-background.png",
  vrPersonAlt: "/images/vr-person-alt.png",
} as const;

const collectionImageMap: Record<string, string> = {
  "remnants-of-stone": "/images/collection-remnants-of-stone.png",
  "bronze-ritual": "/images/collection-bronze-ritual.png",
  "earth-fire": "/images/collection-earth-fire.png",
  "light-through-glass": "/images/collection-light-through-glass.png",
};

/** Returns the public path for an artifact/product thumbnail by slug. */
const artifactSlugAliases: Record<string, string> = {
  "cycladic-marble-figurine": "cycladic-marble-figure",
};

export function getArtifactImage(slug: string): string {
  const resolved = artifactSlugAliases[slug] ?? slug;
  return `/images/artifacts/${resolved}.png`;
}

export function getCollectionImage(slug: string): string | undefined {
  return collectionImageMap[slug];
}

/** Home page category strip thumbnails keyed by display name. */
export const categoryStripImages: Record<string, string> = {
  "Hellenistic Bust": getArtifactImage("portrait-bust-of-a-philosopher"),
  "Cycladic Figure": getArtifactImage("cycladic-marble-figure"),
  "Marble Torso": getArtifactImage("marble-bust-of-a-noblewoman"),
  "Ritual Figure": getArtifactImage("bronze-ritual-standing-figure"),
  "Bronze Head": getArtifactImage("benin-bronze-commemorative-head"),
  "Ceremonial Ding": getArtifactImage("shang-dynasty-bull-vessel"),
  "Terracotta Amphora": getArtifactImage("attic-black-figure-amphora"),
  "Glazed Jug": getArtifactImage("attic-red-figure-kylix"),
  "Glass Flask": getArtifactImage("roman-blue-glass-bowl"),
};

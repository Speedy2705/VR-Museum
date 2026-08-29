/** Runtime paths for page, collection, and artifact media in /public. */
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

const artifactSlugAliases: Record<string, string> = {
  "cycladic-marble-figurine": "cycladic-marble-figure",
};

export function getArtifactImage(slug: string): string {
  return `/images/artifacts/${artifactSlugAliases[slug] ?? slug}.png`;
}

export function getArtifactVideo(slug: string): string {
  return `/videos/artifacts/${artifactSlugAliases[slug] ?? slug}.mp4`;
}

export function getArtifactModel(slug: string): string {
  return `/models/artifacts/${artifactSlugAliases[slug] ?? slug}.glb`;
}

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

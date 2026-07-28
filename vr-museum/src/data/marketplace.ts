export type MarketplaceProduct = {
  slug: string;
  title: string;
  artist: string;
  origin: string;
  period: string;
  material: string;
  lighting: string;
  license: string;
  /** Price in USD, or null if the model is free. */
  price: number | null;
  description: string;
};

export const marketplaceProducts: MarketplaceProduct[] = [
  {
    slug: "attic-red-figure-kylix",
    title: "Attic Red-Figure Kylix",
    artist: "Elena Vasiliev",
    origin: "Athens, Greece",
    period: "480–450 BCE",
    material: "Terracotta",
    lighting: "Warm Diffuse",
    license: "CC-BY 4.0",
    price: 24,
    description:
      "A drinking cup painted with a procession scene in the red-figure technique, scanned at high resolution to preserve the fine linework of the original vase painter.",
  },
  {
    slug: "roman-marble-portrait-bust",
    title: "Roman Marble Portrait Bust",
    artist: "Marco Ferri",
    origin: "Rome, Italy",
    period: "2nd century CE",
    material: "Marble",
    lighting: "Cool Ambient",
    license: "Public Domain",
    price: null,
    description:
      "A weathered portrait bust with individualized features typical of Roman verism, digitized from a museum cast and released for unrestricted use.",
  },
  {
    slug: "cycladic-marble-figurine",
    title: "Cycladic Marble Figurine",
    artist: "Nikos Papadopoulos",
    origin: "Cyclades, Greece",
    period: "2700–2300 BCE",
    material: "Marble",
    lighting: "Cool Ambient",
    license: "Personal Use",
    price: 48,
    description:
      "A minimal folded-arm figurine characteristic of Early Cycladic sculpture, scanned to capture the subtle curvature of the original stone surface.",
  },
  {
    slug: "terracotta-female-figurine",
    title: "Terracotta Female Figurine",
    artist: "Li Wei Chen",
    origin: "Henan, China",
    period: "5th century BCE",
    material: "Terracotta",
    lighting: "Warm Diffuse",
    license: "CC0 Public Domain",
    price: null,
    description:
      "A small votive figurine with traces of original pigment, scanned under soft studio lighting to keep the surface detail legible.",
  },
  {
    slug: "roman-blue-glass-bowl",
    title: "Roman Blue Glass Bowl",
    artist: "Giovanni Moretti",
    origin: "Pompeii, Italy",
    period: "1st–2nd century CE",
    material: "Glass",
    lighting: "Warm Diffuse",
    license: "Commercial Use",
    price: 89,
    description:
      "A blown-glass bowl with an iridescent surface patina, reconstructed from photogrammetry captures for use in commercial renders and print.",
  },
  {
    slug: "benin-bronze-commemorative-head",
    title: "Benin Bronze Commemorative Head",
    artist: "Amir Hassan",
    origin: "Benin City, Nigeria",
    period: "18th century CE",
    material: "Bronze",
    lighting: "Warm Diffuse",
    license: "CC0 Public Domain",
    price: null,
    description:
      "A commemorative cast-bronze head made using the lost-wax technique, scanned from an archival cast and released into the public domain.",
  },
  {
    slug: "bronze-ritual-standing-figure",
    title: "Bronze Ritual Standing Figure",
    artist: "Astrid Bjornson",
    origin: "Scandinavia",
    period: "1300–1100 BCE",
    material: "Bronze",
    lighting: "Raking Light",
    license: "CC-BY 4.0",
    price: 36,
    description:
      "A slender ritual figure with a raised arm, scanned under raking light to bring out the tool marks left by the original bronze caster.",
  },
  {
    slug: "shang-dynasty-bull-vessel",
    title: "Shang Dynasty Bull Vessel",
    artist: "Carlos Mendez",
    origin: "Henan, China",
    period: "1600–1046 BCE",
    material: "Bronze",
    lighting: "Warm Diffuse",
    license: "Commercial Use",
    price: 120,
    description:
      "A ceremonial bronze vessel cast in the form of a bull, decorated with taotie motifs and captured in a high-density scan.",
  },
  {
    slug: "attic-black-figure-amphora",
    title: "Attic Black-Figure Amphora",
    artist: "Zhang Wei",
    origin: "Athens, Greece",
    period: "530–500 BCE",
    material: "Terracotta",
    lighting: "Raking Light",
    license: "CC-BY 4.0",
    price: 55,
    description:
      "A storage amphora painted in the black-figure technique with a mythological battle scene, scanned to preserve incised details.",
  },
  {
    slug: "red-figure-krater-chariot-scene",
    title: "Red-Figure Krater — Chariot Scene",
    artist: "Siobhan O'Brien",
    origin: "Athens, Greece",
    period: "440–400 BCE",
    material: "Terracotta",
    lighting: "Warm Diffuse",
    license: "Public Domain",
    price: null,
    description:
      "A wine-mixing krater depicting a four-horse chariot scene, scanned from a museum loan and released for unrestricted study.",
  },
  {
    slug: "mesopotamian-silver-votive-pair",
    title: "Mesopotamian Silver Votive Pair",
    artist: "Katerina Makris",
    origin: "Mesopotamia",
    period: "2900–2500 BCE",
    material: "Silver",
    lighting: "Cool Ambient",
    license: "Commercial Use",
    price: 74,
    description:
      "A matched pair of silver votive figures, scanned at close range to preserve their fine repoussé surface work.",
  },
  {
    slug: "greek-vase-warriors-horse",
    title: "Greek Vase — Warriors & Horse",
    artist: "Francesco Lombardi",
    origin: "Athens, Greece",
    period: "5th century BCE",
    material: "Terracotta",
    lighting: "Warm Diffuse",
    license: "CC0 Public Domain",
    price: null,
    description:
      "A narrative vase showing armed warriors beside a horse, scanned from a private collection and released into the public domain.",
  },
];

export function getProductBySlug(slug: string) {
  return marketplaceProducts.find((p) => p.slug === slug);
}

export type CollectionArtifact = {
  slug: string;
  title: string;
  material: string;
  period: string;
  lighting: string;
  location: string;
  description: string;
  presetNote: string;
};

export type Collection = {
  slug: string;
  title: string;
  era: string;
  materialTag: "Marble" | "Bronze" | "Ceramic" | "Glass";
  count: number;
  description: string;
  ctaTitle: string;
  artifacts: CollectionArtifact[];
};

export const collections: Collection[] = [
  {
    slug: "remnants-of-stone",
    title: "Remnants of Stone",
    era: "Greco-Roman Antiquities · 300 BCE – 400 CE",
    materialTag: "Marble",
    count: 14,
    description:
      "A curated collection of marble and limestone sculptures from the Greco-Roman world. Each piece has been digitally scanned and rendered with Cool Ambient lighting to honour the pale, translucent quality of the stone.",
    ctaTitle: "See the whole collection in VR",
    artifacts: [
      {
        slug: "portrait-bust-of-a-philosopher",
        title: "Portrait Bust of a Philosopher",
        material: "Marble",
        period: "2nd century CE",
        lighting: "Cool Ambient",
        location: "Rome, Italy",
        description:
          "A finely worked portrait bust believed to represent a Stoic philosopher, notable for the deep undercutting of the beard.",
        presetNote:
          "Even bluish fill — ideal for marble and pale stone.",
      },
      {
        slug: "cycladic-marble-figure",
        title: "Cycladic Marble Figure",
        material: "Marble",
        period: "2700–2300 BCE",
        lighting: "Cool Ambient",
        location: "Cyclades, Greece",
        description:
          "A minimal folded-arm figure characteristic of Early Cycladic sculpture, scanned to capture the subtle curvature of the original stone surface.",
        presetNote:
          "Even bluish fill — ideal for marble and pale stone.",
      },
      {
        slug: "marble-bust-of-a-noblewoman",
        title: "Marble Bust of a Noblewoman",
        material: "Pentelic Marble",
        period: "1st century BCE",
        lighting: "Warm Diffuse",
        location: "Athens, Greece",
        description:
          "An idealized portrait bust with an elaborate braided hairstyle, typical of late Hellenistic portraiture of elite women.",
        presetNote:
          "Soft amber fill that warms pale stone and flatters carved detail.",
      },
      {
        slug: "attic-red-figure-amphora",
        title: "Attic Red-Figure Amphora",
        material: "Terracotta",
        period: "480–450 BCE",
        lighting: "Raking Light",
        location: "Athens, Greece",
        description:
          "A storage amphora painted with a mythological scene in the red-figure technique, scanned to preserve the fine linework of the vase painter.",
        presetNote:
          "Low single-angle light that reveals surface texture and tool marks.",
      },
    ],
  },
  {
    slug: "bronze-ritual",
    title: "Bronze & Ritual",
    era: "Early Bronze Age · 1600–1100 BCE",
    materialTag: "Bronze",
    count: 9,
    description:
      "Cast-bronze figures and ceremonial vessels from across the ancient world, scanned under lighting that highlights the tool marks and patina left by centuries underground.",
    ctaTitle: "Walk the ritual gallery in VR",
    artifacts: [
      {
        slug: "bronze-ritual-standing-figure",
        title: "Bronze Ritual Standing Figure",
        material: "Bronze",
        period: "1300–1100 BCE",
        lighting: "Raking Light",
        location: "Scandinavia",
        description:
          "A slender ritual figure with a raised arm, scanned under raking light to bring out the tool marks left by the original bronze caster.",
        presetNote:
          "Low single-angle light that reveals surface texture and tool marks.",
      },
      {
        slug: "benin-bronze-commemorative-head",
        title: "Benin Bronze Commemorative Head",
        material: "Bronze",
        period: "18th century CE",
        lighting: "Warm Diffuse",
        location: "Benin City, Nigeria",
        description:
          "A commemorative cast-bronze head made using the lost-wax technique, scanned from an archival cast to preserve its fine surface detail.",
        presetNote:
          "Soft amber fill — ideal for warming bronze and other metals.",
      },
      {
        slug: "shang-dynasty-bull-vessel",
        title: "Shang Dynasty Bull Vessel",
        material: "Bronze",
        period: "1600–1046 BCE",
        lighting: "Warm Diffuse",
        location: "Henan, China",
        description:
          "A ceremonial bronze vessel cast in the form of a bull, decorated with taotie motifs and captured in a high-density scan.",
        presetNote:
          "Soft amber fill — ideal for warming bronze and other metals.",
      },
      {
        slug: "mycenaean-bronze-dagger",
        title: "Mycenaean Bronze Dagger",
        material: "Bronze",
        period: "1600–1400 BCE",
        lighting: "Directional Spot",
        location: "Mycenae, Greece",
        description:
          "A ceremonial dagger with an inlaid blade, scanned under a sharp directional light to catch the detail of its gold and silver inlay.",
        presetNote:
          "Sharp key light that catches fine metalwork and inlay.",
      },
    ],
  },
  {
    slug: "earth-fire",
    title: "Earth & Fire",
    era: "Ceramic & Terracotta · 700 BCE – 500 CE",
    materialTag: "Ceramic",
    count: 21,
    description:
      "Painted vessels and terracotta figures spanning the Mediterranean and East Asia, rendered to preserve the fine linework left by ancient potters and painters.",
    ctaTitle: "Explore the kiln room in VR",
    artifacts: [
      {
        slug: "attic-red-figure-kylix",
        title: "Attic Red-Figure Kylix",
        material: "Terracotta",
        period: "480–450 BCE",
        lighting: "Warm Diffuse",
        location: "Athens, Greece",
        description:
          "A drinking cup painted with a procession scene in the red-figure technique, scanned at high resolution to preserve the fine linework of the original vase painter.",
        presetNote:
          "Soft amber fill — ideal for ceramics, terracotta, and bone.",
      },
      {
        slug: "attic-black-figure-amphora",
        title: "Attic Black-Figure Amphora",
        material: "Terracotta",
        period: "530–500 BCE",
        lighting: "Raking Light",
        location: "Athens, Greece",
        description:
          "A storage amphora painted in the black-figure technique with a mythological battle scene, scanned to preserve incised details.",
        presetNote:
          "Low single-angle light that reveals surface texture and tool marks.",
      },
      {
        slug: "terracotta-female-figurine",
        title: "Terracotta Female Figurine",
        material: "Terracotta",
        period: "5th century BCE",
        lighting: "Warm Diffuse",
        location: "Henan, China",
        description:
          "A small votive figurine with traces of original pigment, scanned under soft studio lighting to keep the surface detail legible.",
        presetNote: "Even, shadowless light for delicate surface detail.",
      },
      {
        slug: "red-figure-krater-chariot-scene",
        title: "Red-Figure Krater — Chariot Scene",
        material: "Terracotta",
        period: "440–400 BCE",
        lighting: "Warm Diffuse",
        location: "Athens, Greece",
        description:
          "A wine-mixing krater depicting a four-horse chariot scene, scanned from a museum loan and rendered for open study.",
        presetNote:
          "Soft amber fill — ideal for ceramics, terracotta, and bone.",
      },
    ],
  },
  {
    slug: "light-through-glass",
    title: "Light Through Glass",
    era: "Roman & Islamic Glasswork · 100 BCE – 800 CE",
    materialTag: "Glass",
    count: 7,
    description:
      "Blown and cut glass vessels scanned under backlighting to capture the translucency and iridescent surface patina unique to ancient glass.",
    ctaTitle: "See the glass gallery lit up in VR",
    artifacts: [
      {
        slug: "roman-blue-glass-bowl",
        title: "Roman Blue Glass Bowl",
        material: "Glass",
        period: "1st–2nd century CE",
        lighting: "Backlit Halo",
        location: "Pompeii, Italy",
        description:
          "A blown-glass bowl with an iridescent surface patina, reconstructed from photogrammetry captures to preserve its translucency.",
        presetNote: "Rim lighting that reveals translucency in glass and crystal.",
      },
      {
        slug: "islamic-enameled-glass-beaker",
        title: "Islamic Enameled Glass Beaker",
        material: "Glass",
        period: "13th century CE",
        lighting: "Backlit Halo",
        location: "Syria",
        description:
          "A gilded and enameled beaker with a hunting scene, scanned with backlighting to bring out the layered colour of the enamel.",
        presetNote: "Rim lighting that reveals translucency in glass and crystal.",
      },
      {
        slug: "roman-glass-unguentarium",
        title: "Roman Glass Unguentarium",
        material: "Glass",
        period: "1st century CE",
        lighting: "Backlit Halo",
        location: "Levant",
        description:
          "A slender perfume flask with a swirling iridescent surface, typical of vessels used to store scented oils.",
        presetNote: "Rim lighting that reveals translucency in glass and crystal.",
      },
      {
        slug: "sasanian-cut-glass-bowl",
        title: "Sasanian Cut Glass Bowl",
        material: "Glass",
        period: "5th–6th century CE",
        lighting: "Cool Ambient",
        location: "Persia",
        description:
          "A honeycomb-cut glass bowl, scanned under even ambient light to capture the faceted pattern ground into its surface.",
        presetNote: "Even blue-white fill — ideal for glass and pale stone.",
      },
    ],
  },
];

export function getCollectionBySlug(slug: string) {
  return collections.find((c) => c.slug === slug);
}

export function getArtifact(collectionSlug: string, artifactSlug: string) {
  const collection = getCollectionBySlug(collectionSlug);
  const artifact = collection?.artifacts.find((a) => a.slug === artifactSlug);
  return collection && artifact ? { collection, artifact } : undefined;
}

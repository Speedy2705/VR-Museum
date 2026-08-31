import SlideUp from "@/components/motion/SlideUp";
import { ARTIFACT_CATEGORIES } from "@/lib/artifact-categories";
import { LIGHT_TEMPERATURES } from "@/lib/lighting-presets";

const presets = [
  {
    title: "Spotlight",
    tags: "Focused · Dramatic · Sculptural",
    desc: "A focused beam from above and one side creates clear highlights and directs attention to a selected feature.",
  },
  {
    title: "Top Light",
    tags: "Vertical · Contoured · Grounded",
    desc: "Light falling from above defines upper contours while grounding the artifact with a controlled shadow.",
  },
  {
    title: "Front-Facing Light",
    tags: "Even · Legible · Documentary",
    desc: "Even illumination from the viewer’s direction preserves colour and makes form, pattern, and painted detail easy to read.",
  },
  {
    title: "Raking Light",
    tags: "Low Angle · Textured · Revealing",
    desc: "A low grazing beam stretches shadows across a surface to reveal carving, weave, inscriptions, folds, and tool marks.",
  },
  {
    title: "Backlight",
    tags: "Silhouette · Translucent · Atmospheric",
    desc: "A source behind the artifact outlines its silhouette and can reveal translucency in glass, resin, or thin material.",
  },
];

export default function StudioPresets() {
  const categoriesByTemperature = LIGHT_TEMPERATURES.map((temperature) => ({
    ...temperature,
    categories: ARTIFACT_CATEGORIES.filter((category) => category.lightTemperature === temperature.key),
  }));

  return (
    <section className="bg-cream border-t border-line px-10 py-24 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <SlideUp>
        <p className="text-xs tracking-[0.22em] font-medium text-charcoal uppercase">
          Museum Lighting
        </p>
        <h2 className="font-display mt-5 text-4xl italic">
          Tested Light Colour Temperatures for Each Artifact Type
        </h2>

        <p className="mt-5 max-w-3xl text-[15px] leading-7 text-charcoal">
          A key part of ViswaRoop is our project&apos;s tested lighting recommendations. We assign a suitable light colour temperature to each artifact domain so its material, colour, carving, and surface detail remain clear in the digital exhibit.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {categoriesByTemperature.map((temperature) => (
            <article key={temperature.key} className="border border-ink/15 bg-white/55 p-6 shadow-[0_12px_30px_rgba(35,28,20,0.05)]">
              <p className="text-xs tracking-label font-medium uppercase text-charcoal">{temperature.kelvin} K</p>
              <h3 className="font-display mt-2 text-3xl italic text-ink">{temperature.name}</h3>
              <p className="mt-3 text-[15px] leading-7 text-charcoal">{temperature.description}</p>
              {temperature.categories.length ? (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs tracking-label font-medium uppercase text-charcoal">Best suited in our museum for</p>
                  <ul className="mt-3 space-y-2 text-sm text-charcoal">
                    {temperature.categories.map((category) => (
                      <li key={category.key}><span className="font-medium text-ink">{category.name}</span> — {category.description}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-charcoal">Available as a tested alternative for clay, wood, aged finishes, and warm pigments when a warmer presentation is preferred.</p>
              )}
            </article>
          ))}
        </div>

        <h2 className="font-display mt-20 text-4xl italic">
          Five Lighting Directions
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {presets.map((p) => (
            <div
              key={p.title}
              className="border border-ink/15 bg-white/55 p-6 shadow-[0_12px_30px_rgba(35,28,20,0.04)]"
            >
              <h3 className="font-display text-2xl italic text-ink">{p.title}</h3>
              <p className="mt-2 text-xs tracking-wide font-medium text-charcoal uppercase">
                {p.tags}
              </p>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-charcoal">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
        </SlideUp>
      </div>
    </section>
  );
}

import SlideUp from "@/components/motion/SlideUp";

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
  return (
    <section className="bg-cream border-t border-line px-10 py-24 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <SlideUp>
        <p className="text-xs tracking-[0.3em] text-stone uppercase">
          Museum Lighting
        </p>
        <h2 className="font-display mt-5 text-4xl italic">
          Five Lighting Directions
        </h2>

        <div className="mt-14 grid grid-cols-1 border-t border-line md:grid-cols-2 md:divide-x md:divide-line">
          {presets.map((p, i) => (
            <div
              key={p.title}
              className={`border-b border-line px-0 py-8 md:px-10 ${
                i % 2 === 0 ? "md:pl-0" : "md:pr-0"
              }`}
            >
              <h3 className="text-base text-ink">{p.title}</h3>
              <p className="mt-1.5 text-xs tracking-wide text-stone-light uppercase">
                {p.tags}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-stone">
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

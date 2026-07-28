import SlideUp from "@/components/motion/SlideUp";

const presets = [
  {
    title: "Warm Diffuse",
    tags: "Ceramic · Terracotta · Bone",
    desc: "A broad, soft amber source from above. Eliminates harsh shadow and shows the warmth of fired clay surfaces.",
  },
  {
    title: "Directional Spot",
    tags: "Bronze · Gold · Silver",
    desc: "A narrow, high-intensity key light at 45°. Creates specular highlights that reveal cast surface texture on metal.",
  },
  {
    title: "Cool Ambient",
    tags: "Marble · Limestone · Ivory",
    desc: "A diffuse, bluish fill matching the colour temperature of overcast northern daylight — ideal for pale stone.",
  },
  {
    title: "Backlit Halo",
    tags: "Glass · Crystal · Resin",
    desc: "A translucent rim source behind the artifact. Light passes through the material, revealing internal colour.",
  },
  {
    title: "Raking Light",
    tags: "Stone · Wood · Leather",
    desc: "A low-angle grazing light at 10–15° from the surface. Makes incised marks and surface texture legible.",
  },
];

export default function StudioPresets() {
  return (
    <section className="bg-cream border-t border-line px-10 py-24 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <SlideUp>
        <p className="text-[11px] tracking-[0.3em] text-stone uppercase">
          Lighting Science
        </p>
        <h2 className="font-display mt-5 text-4xl italic">
          Five Studio Presets
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
              <p className="mt-1.5 text-[11px] tracking-wide text-stone-light uppercase">
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

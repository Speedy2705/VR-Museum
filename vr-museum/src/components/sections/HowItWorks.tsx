import SlideUp from "@/components/motion/SlideUp";

const steps = [
  {
    numeral: "I",
    title: "Contribute the artifact",
    desc: "Eligible artists, archaeologists, and curators upload a display image with a supported 3D model or video, or optionally begin from three reference photographs.",
  },
  {
    numeral: "II",
    title: "Document and present it",
    desc: "Add its story, material, origin, collection, license, and price, then choose lighting suited to how the object should be studied and displayed.",
  },
  {
    numeral: "III",
    title: "Curators review it",
    desc: "A curator evaluates the media and context, then approves the submission, requests focused changes, or rejects it with an explanation.",
  },
  {
    numeral: "IV",
    title: "Discover and collect it",
    desc: "Approved work becomes discoverable in the museum and, when listed, can be licensed through the marketplace for study, presentation, or permitted commercial use.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-cream px-10 py-24 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <SlideUp>
        <p className="text-[11px] tracking-[0.3em] text-stone uppercase">
          Process
        </p>
        <h2 className="font-display mt-5 text-4xl italic">How It Works</h2>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.numeral}>
              <span className="font-display text-4xl text-stone-light italic">
                {s.numeral}
              </span>
              <h3 className="mt-4 text-base text-ink">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
        </SlideUp>
      </div>
    </section>
  );
}

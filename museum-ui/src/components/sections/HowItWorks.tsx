import SlideUp from "@/components/motion/SlideUp";

const steps = [
  {
    numeral: "I",
    title: "Upload your artifact",
    desc: "Artists and curators upload a 3D scan, model file (.glb, .obj, .fbx), or a video recording of the physical object. Our pipeline reconstructs a mesh from video automatically.",
  },
  {
    numeral: "II",
    title: "Configure the lighting",
    desc: "Choose a preset matched to the material — warm diffuse for ceramics, directional spot for metal, backlit halo for glass. Adjust colour temperature and intensity.",
  },
  {
    numeral: "III",
    title: "Placed in the museum",
    desc: "Our team places your artifact in a photorealistic virtual museum — pedestal, label, room, lighting rig — positioned alongside the broader collection.",
  },
  {
    numeral: "IV",
    title: "Explore in VR",
    desc: "Visitors put on a headset and walk through the museum. They move around each artifact, examine surface detail, and switch lighting in real time.",
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

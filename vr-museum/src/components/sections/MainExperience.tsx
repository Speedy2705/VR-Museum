import PlaceholderImage from "@/components/ui/PlaceholderImage";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { pageImages } from "@/lib/media";

const features = [
  {
    title: "Material-aware lighting",
    desc: "Reveal form, texture, colour, and surface detail",
  },
  {
    title: "Interactive 3D study",
    desc: "Rotate, inspect, and focus on available models",
  },
  {
    title: "Curated presentation",
    desc: "Museum environments, labels, frames, and pedestals",
  },
  {
    title: "Browser-based access",
    desc: "Immersive-device support where available",
  },
];

export default function MainExperience() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <div className="relative h-[520px] md:h-auto">
        <PlaceholderImage
          src={pageImages.vrPersonAlt}
          alt="Person wearing a VR headset and holding controllers"
          label="VR headset photo"
          sizes="(min-width: 768px) 50vw, 100vw"
          dark
        />
      </div>

      <div className="bg-ink px-10 py-20 text-white md:px-16 md:py-24">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Immersive 3D Experience
        </p>

        <h2 className="font-display mt-6 max-w-md text-4xl leading-[1.2] italic md:text-[42px]">
          See every artifact in context
        </h2>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/60">
          ViswaRoop presents approved artifacts inside a spatial museum environment
          with exhibition furniture, contextual plaques, and carefully designed
          lighting. Inspect a model from multiple angles or enter its browser-based
          virtual gallery for a more immersive encounter.
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
          Lighting can be adjusted to reveal form, colour, texture, inscriptions,
          reflective surfaces, and textile depth. The presentation adapts to the
          material instead of treating every cultural object in the same way.
        </p>

        <div className="mt-11 grid max-w-md grid-cols-2 gap-x-8 gap-y-7">
          {features.map((f) => (
            <div key={f.title}>
              <p className="text-sm text-white/90">{f.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/40">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <VrEntryModal className="mt-11" />
      </div>
    </section>
  );
}

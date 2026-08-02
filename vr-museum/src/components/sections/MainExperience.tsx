import PlaceholderImage from "@/components/ui/PlaceholderImage";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { pageImages } from "@/lib/media";

const features = [
  {
    title: "Physically-based lighting",
    desc: "Simulates real photon behaviour per material",
  },
  {
    title: "Full-scale artifacts",
    desc: "Walk around at 1:1 size",
  },
  {
    title: "Live lighting controls",
    desc: "Switch presets inside the headset",
  },
  {
    title: "All major headsets",
    desc: "Quest, Vision Pro, PSVR2, WebXR",
  },
];

export default function MainExperience() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <div className="relative h-[520px] md:h-auto">
        <PlaceholderImage
          src={pageImages.vrPerson}
          alt="Person wearing a VR headset and holding controllers"
          label="VR headset photo"
          sizes="(min-width: 768px) 50vw, 100vw"
          dark
        />
      </div>

      <div className="bg-ink px-10 py-20 text-white md:px-16 md:py-24">
        <p className="text-[11px] tracking-[0.3em] text-white/40 uppercase">
          The Main Experience
        </p>

        <h2 className="font-display mt-6 max-w-md text-4xl leading-[1.2] italic md:text-[42px]">
          The Museum Comes to You
        </h2>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/60">
          ViswaRoop places every uploaded artifact inside a photorealistic museum.
          You walk through it in full virtual reality — moving around each
          pedestal, leaning in to examine surface texture, and switching the
          studio lighting in real time.
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
          Our lighting engine simulates how photons interact with each
          material. Bronze looks different under a directional spot than
          under diffuse ambient — and that difference matters for artists,
          researchers, and visitors alike.
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

import VrEntryModal from "@/components/ui/VrEntryModal";
import SlideUp from "@/components/motion/SlideUp";

export default function MissionSplit() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <div className="bg-cream px-10 py-20 md:px-16 md:py-24">
        <SlideUp>
        <p className="text-xs tracking-[0.3em] text-stone uppercase">
          Our Mission
        </p>
        <h2 className="font-display mt-6 max-w-md text-4xl leading-[1.2] italic md:text-[38px]">
          Preserve stories and expand access
        </h2>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-charcoal/80">
          ViswaRoop reimagines the museum as a participatory digital space.
          Visitors discover cultural objects beyond physical boundaries, while
          artists, archaeologists, and curators can contribute documented digital
          works for review and responsible public presentation.
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-charcoal/80">
          The platform connects preservation with sustainable participation.
          Approved contributors can publish licensed work, institutions can
          present collections in context, and researchers or collectors can
          acquire digital artifacts under clearly stated terms.
        </p>
        </SlideUp>
      </div>

      <div className="bg-ink px-10 py-20 text-white md:px-16 md:py-24">
        <SlideUp delay={0.08}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70">
          <rect x="2" y="7" width="20" height="10" rx="5" />
          <circle cx="8" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="16" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>

        <p className="mt-6 text-xs tracking-[0.3em] text-white/40 uppercase">
          The Digital Experience
        </p>
        <h2 className="font-display mt-4 max-w-md text-4xl leading-[1.2] italic md:text-[38px]">
          Study objects through space, media, and light
        </h2>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/60">
          Move from an artifact’s story to its photograph, video, or interactive
          model, then enter a browser-based virtual exhibition with contextual
          plaques and museum staging. Lighting controls help reveal the qualities
          that matter for each material and making tradition.
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
          The experience works on the web and supports immersive devices where
          browser and hardware capabilities allow it.
        </p>

        <VrEntryModal label="Try VR Now" className="mt-10" />
        </SlideUp>
      </div>
    </section>
  );
}

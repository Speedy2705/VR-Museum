import VrEntryModal from "@/components/ui/VrEntryModal";
import SlideUp from "@/components/motion/SlideUp";

export default function MissionSplit() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <div className="bg-cream px-10 py-20 md:px-16 md:py-24">
        <SlideUp>
        <p className="text-[11px] tracking-[0.3em] text-stone uppercase">
          Our Mission
        </p>
        <h2 className="font-display mt-6 max-w-md text-4xl leading-[1.2] italic md:text-[38px]">
          Making history accessible, one artifact at a time
        </h2>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-charcoal/80">
          Most historical artifacts sit in storage or behind thick glass,
          accessible to a tiny fraction of the world. NAME changes that —
          giving every curator the tools to bring their objects into a shared
          virtual space where anyone, anywhere, can study them in detail.
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-charcoal/80">
          Our lighting engine simulates how photons interact with each
          surface material. Bronze looks different under a directional spot
          than under diffuse ambient light — and that difference matters for
          researchers, conservators, and curious visitors alike.
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

        <p className="mt-6 text-[11px] tracking-[0.3em] text-white/40 uppercase">
          The VR Experience
        </p>
        <h2 className="font-display mt-4 max-w-md text-4xl leading-[1.2] italic md:text-[38px]">
          The Museum Comes to You
        </h2>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/60">
          Put on a VR headset and walk through a photorealistic museum. Move
          around each pedestal at full scale, lean in to examine surface
          texture, and switch lighting presets in real time — just as you
          would with a physical spotlight.
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
          Compatible with Meta Quest 2 &amp; 3, Apple Vision Pro, PlayStation
          VR2, and any WebXR-capable browser.
        </p>

        <VrEntryModal label="Try VR Now" className="mt-10" />
        </SlideUp>
      </div>
    </section>
  );
}

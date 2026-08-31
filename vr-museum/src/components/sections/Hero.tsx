import Button from "@/components/ui/Button";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { pageImages } from "@/lib/media";
import SlideUp from "@/components/motion/SlideUp";
import BrandLogo from "@/components/ui/BrandLogo";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Ref } from "react";

type HeroProps = {
  brandAnchorRef?: Ref<HTMLDivElement>;
  showBrand?: boolean;
  sharedBrand?: boolean;
};

export default function Hero({ brandAnchorRef, showBrand = true, sharedBrand = false }: HeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex h-[820px] w-full items-center justify-center overflow-hidden">
      <PlaceholderImage
        src={pageImages.heroGallery}
        priority
        alt="Museum gallery interior with framed paintings"
        label="Hero — museum gallery photo"
        sizes="100vw"
        dark
        className="absolute inset-0"
      />
      {/* darkening overlay so white text stays legible over any photo */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      <SlideUp className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <div ref={brandAnchorRef} className="mb-6 flex h-[138px] w-72 items-center justify-center sm:h-[154px] sm:w-80">
          <AnimatePresence initial={false}>
            {showBrand && (
              <motion.div
                layoutId={sharedBrand ? "viswaroop-home-brand" : undefined}
                initial={sharedBrand || reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={sharedBrand || reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                <BrandLogo
                  variant="light"
                  className="h-auto w-72 drop-shadow-[0_8px_22px_rgba(0,0,0,0.4)] sm:w-80"
                  priority
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-xs tracking-[0.24em] text-white/85 uppercase">
          The Museum Without Walls
        </p>

        <h1 className="font-display mt-6 text-5xl leading-[1.15] font-normal text-white italic sm:text-6xl md:text-[64px]">
          Explore. Experience.
          <br />
          Discover Living History.
        </h1>

        <p className="mt-7 max-w-xl text-[15px] leading-7 text-white/90">
          Explore cultural heritage through images, video, interactive 3D, and
          browser-based virtual galleries. Contribute, curate, license, and
          collect digital artifacts in one multilingual museum.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <VrEntryModal />
          <Button href="/collections" variant="outline">
            View Collections
          </Button>
        </div>
        <p className="mt-4 text-sm text-white/80">Designed for both standard screens and compatible VR headsets.</p>
      </SlideUp>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/50">
        <span className="text-xs tracking-label uppercase">Scroll</span>
        <span className="h-8 w-px bg-white/40" />
      </div>
    </section>
  );
}

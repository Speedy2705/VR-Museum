"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

type Props = { viewer: ReactNode; overlay: ReactNode; overlayActions?: ReactNode; overlayLabel?: string; immersiveDetails?: boolean };

export default function ArtifactStageFullscreen({ viewer, overlay, overlayActions, overlayLabel = "Artifact details", immersiveDetails = false }: Props) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <section className={immersiveDetails ? "flex min-h-[calc(100dvh-5rem)] flex-col bg-ink md:relative md:block md:h-[calc(100dvh-5rem)] md:min-h-0 md:overflow-hidden" : "relative h-[calc(100dvh-5rem)] w-full overflow-hidden bg-ink"} aria-label="Fullscreen artifact viewer">
      <div className={immersiveDetails ? "h-[62dvh] min-h-[28rem] md:absolute md:inset-0 md:h-auto md:min-h-0" : "absolute inset-0"}>{viewer}</div>
      {!immersiveDetails && <button type="button" aria-expanded={open} aria-controls="artifact-stage-overlay" onClick={() => setOpen((value) => !value)} className="absolute bottom-4 left-4 z-30 bg-cream/95 px-4 py-3 text-[10px] tracking-label text-ink uppercase shadow-xl backdrop-blur md:hidden">
        {open ? "Hide details" : "Details"}
      </button>}
      <motion.aside id="artifact-stage-overlay" aria-label={overlayLabel} initial={reduceMotion ? false : { opacity: 0, x: immersiveDetails ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={immersiveDetails ? "relative z-20 flex flex-col bg-[#191816] p-6 text-cream md:hidden" : `${open ? "flex" : "hidden"} absolute inset-x-4 bottom-16 z-20 max-h-[calc(100%-5rem)] flex-col overflow-y-auto border border-white/20 bg-cream/90 p-5 text-ink shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-5 md:left-5 md:flex md:max-h-[calc(100%-2.5rem)] md:w-[min(28rem,calc(100%-2.5rem))] md:p-6`}>
        {overlay}
      </motion.aside>
      {immersiveDetails && overlayActions && <div className="relative z-20 border-t border-white/15 bg-[#242321] p-6 text-cream md:absolute md:bottom-4 md:right-[4.5%] md:w-[40%] md:border md:border-white/20 md:bg-black/55 md:p-4 md:shadow-2xl md:backdrop-blur-md">{overlayActions}</div>}
    </section>
  );
}

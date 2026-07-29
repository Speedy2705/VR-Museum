"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

type Props = { viewer: ReactNode; overlay: ReactNode; overlayLabel?: string };

export default function ArtifactStageFullscreen({ viewer, overlay, overlayLabel = "Artifact details" }: Props) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative h-[calc(100dvh-5rem)] w-full overflow-hidden bg-ink" aria-label="Fullscreen artifact viewer">
      <div className="absolute inset-0">{viewer}</div>
      <button type="button" aria-expanded={open} aria-controls="artifact-stage-overlay" onClick={() => setOpen((value) => !value)} className="absolute bottom-4 left-4 z-30 bg-cream/95 px-4 py-3 text-[10px] tracking-label text-ink uppercase shadow-xl backdrop-blur md:hidden">
        {open ? "Hide details" : "Details"}
      </button>
      <motion.aside id="artifact-stage-overlay" aria-label={overlayLabel} initial={reduceMotion ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${open ? "flex" : "hidden"} absolute inset-x-4 bottom-16 z-20 max-h-[calc(100%-5rem)] flex-col overflow-y-auto border border-white/20 bg-cream/90 p-5 text-ink shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-5 md:left-5 md:flex md:max-h-[calc(100%-2.5rem)] md:w-[min(28rem,calc(100%-2.5rem))] md:p-6`}>
        {overlay}
      </motion.aside>
    </section>
  );
}

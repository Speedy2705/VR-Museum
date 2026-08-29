"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

type Props = { viewer: ReactNode; overlay: ReactNode; overlayActions?: ReactNode; overlayLabel?: string; immersiveDetails?: boolean; splitDetails?: boolean; stackedDetails?: boolean; studioSplit?: boolean; hideOverlayActions?: boolean };

export default function ArtifactStageFullscreen({ viewer, overlay, overlayActions, overlayLabel = "Artifact details", immersiveDetails = false, splitDetails = false, stackedDetails = false, studioSplit = false, hideOverlayActions = false }: Props) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  if (studioSplit) return (
    <section className="flex min-h-[44rem] flex-col overflow-hidden border border-line bg-ink md:grid md:h-[72dvh] md:min-h-[38rem] md:grid-cols-[minmax(0,1.75fr)_minmax(22rem,0.85fr)]" aria-label="Artifact lighting studio">
      <div className="h-[55dvh] min-h-[26rem] w-full md:h-full">{viewer}</div>
      <aside className="overflow-y-auto border-t border-line bg-cream p-6 text-ink md:border-t-0 md:border-l md:p-8" aria-label={overlayLabel}>
        {overlay}
        {overlayActions && <div className="mt-8 border-t border-line pt-6">{overlayActions}</div>}
      </aside>
    </section>
  );

  if (stackedDetails) return (
    <section className="bg-ink" aria-label="Artifact lighting studio">
      <div className="h-[60dvh] min-h-[28rem] w-full">{viewer}</div>
      <div className="border-t border-line bg-cream p-6 text-ink md:p-10" aria-label={overlayLabel}>
        <div className="mx-auto max-w-5xl">{overlay}{overlayActions && <div className="mt-8 border-t border-line pt-6">{overlayActions}</div>}</div>
      </div>
    </section>
  );

  return (
    <section className={immersiveDetails ? "flex min-h-[calc(100dvh-5rem)] flex-col bg-ink md:relative md:block md:h-[calc(100dvh-5rem)] md:min-h-0 md:overflow-hidden" : splitDetails ? "flex min-h-[calc(100dvh-5rem)] flex-col bg-ink md:grid md:h-[calc(100dvh-5rem)] md:min-h-0 md:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] md:overflow-hidden" : "relative h-[calc(100dvh-5rem)] w-full overflow-hidden bg-ink"} aria-label="Fullscreen artifact viewer">
      <div className={immersiveDetails ? "h-[62dvh] min-h-[28rem] md:absolute md:inset-0 md:h-auto md:min-h-0" : splitDetails ? "h-[58dvh] min-h-80 md:h-full md:min-h-0" : "absolute inset-0"}>{viewer}</div>
      {!immersiveDetails && !splitDetails && <button type="button" aria-expanded={open} aria-controls="artifact-stage-overlay" onClick={() => setOpen((value) => !value)} className="absolute bottom-4 left-4 z-30 bg-cream/95 px-4 py-3 text-xs tracking-label text-ink uppercase shadow-xl backdrop-blur md:hidden">
        {open ? "Hide details" : "Details"}
      </button>}
      <motion.aside id="artifact-stage-overlay" aria-label={overlayLabel} initial={reduceMotion ? false : { opacity: 0, x: immersiveDetails ? 20 : splitDetails ? 16 : -20 }} animate={{ opacity: 1, x: 0 }} className={immersiveDetails ? "relative z-20 flex flex-col bg-[#191816] p-6 text-cream md:hidden" : splitDetails ? "relative z-20 flex flex-col overflow-y-auto border-t border-[#b1843d]/35 bg-cream p-6 text-[#8b611f] [&_a]:!text-sm [&_a]:!text-[#8b611f] [&_dd]:!text-base [&_dd]:!text-[#8b611f] [&_dt]:!text-base [&_dt]:!text-[#9b7842] [&_h1]:!text-4xl [&_h1]:!text-[#75501a] [&_h2]:!text-3xl [&_h2]:!text-[#75501a] [&_p]:!text-base [&_p]:!leading-relaxed [&_p]:!text-[#8b611f] [&_span]:!text-sm [&_span]:!text-[#8b611f] md:h-full md:border-t-0 md:border-l md:p-8" : `${open ? "flex" : "hidden"} absolute inset-x-4 bottom-16 z-20 max-h-[calc(100%-5rem)] flex-col overflow-y-auto border border-white/20 bg-cream/90 p-5 text-ink shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-5 md:left-5 md:flex md:max-h-[calc(100%-2.5rem)] md:w-[min(28rem,calc(100%-2.5rem))] md:p-6`}>
        {overlay}
        {splitDetails && overlayActions && <div className="mt-7 border-t border-[#b1843d]/30 pt-5">{overlayActions}</div>}
      </motion.aside>
      {immersiveDetails && overlayActions && !hideOverlayActions && <div className="relative z-20 border-t border-white/15 bg-[#242321] p-6 text-cream md:absolute md:bottom-4 md:right-[4.5%] md:w-[40%] md:border md:border-white/20 md:bg-black/55 md:p-4 md:shadow-2xl md:backdrop-blur-md">{overlayActions}</div>}
    </section>
  );
}

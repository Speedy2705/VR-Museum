"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import AmbientArView from "./AmbientArView";
import { keyFromDisplayName } from "@/lib/lighting-presets";

const VideoPlayer = dynamic(() => import("./ArtifactVideoPlayer"), { ssr: false, loading: () => <MediaLoading label="Preparing video" /> });
const ModelViewer = dynamic(() => import("./LightingStudioViewer"), { ssr: false, loading: () => <MediaLoading label="Preparing 3D view" /> });

type MediaKind = "image" | "video" | "model";
type Props = { title: string; image?: string; video?: string; model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" | "usdz" }; lighting?: string | null; primaryMediaType?: MediaKind };

function MediaLoading({ label }: { label: string }) { return <div className="flex h-full items-center justify-center bg-cream-dark text-[10px] tracking-label text-stone uppercase">{label}…</div>; }

export default function ArtifactMediaStage({ title, image, video, model, lighting, primaryMediaType = "image" }: Props) {
  const available: MediaKind[] = ["image", ...(video ? ["video" as const] : []), ...(model ? ["model" as const] : [])];
  const initial = available.includes(primaryMediaType) ? primaryMediaType : "image";
  const [active, setActive] = useState<MediaKind>(initial);
  const [expanded, setExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const tabsId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!expanded) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button, select, input, [tabindex]:not([tabindex="-1"])');
      if (!controls?.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; trigger?.focus(); };
  }, [expanded]);

  const renderActive = (modal = false) => {
    if (active === "video" && video) return <VideoPlayer key={modal ? "modal-video" : "video"} src={video} poster={image} title={title} />;
    if (active === "model" && model && model.format !== "usdz") return <div className="relative h-full"><ModelViewer key={modal ? "modal-model" : "model"} src={model.url} format={model.format} presetKey={keyFromDisplayName(lighting)} poster={image} title={title} />{(model.format === "glb" || model.format === "gltf") && <div className="absolute right-3 top-3 z-20"><AmbientArView src={model.url} alt={`${title} in augmented reality`} /></div>}</div>;
    return <PlaceholderImage src={image} alt={title} label={title} sizes={modal ? "100vw" : "(min-width: 768px) 50vw, 100vw"} />;
  };

  return <>
    <div className="w-full">
      {available.length > 1 && <div role="tablist" aria-label="Artifact media" className="mb-3 flex border border-line bg-cream-dark p-1">{available.map((kind) => <button key={kind} id={`${tabsId}-${kind}`} type="button" role="tab" aria-selected={active === kind} aria-controls={`${tabsId}-panel`} onClick={() => setActive(kind)} className={`flex-1 px-3 py-2 text-[9px] tracking-label uppercase transition-colors ${active === kind ? "bg-ink text-cream" : "text-stone hover:bg-cream"}`}>{kind === "model" ? "3D View" : kind === "image" ? "Photo" : "Video"}</button>)}</div>}
      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${active}`} className="relative aspect-[4/5] w-full overflow-hidden bg-cream-dark">
        {renderActive()}
        <button ref={triggerRef} type="button" onClick={() => setExpanded(true)} aria-label={`Expand ${active === "model" ? "3D view" : active}`} className="absolute bottom-3 right-3 z-20 bg-cream/95 px-3 py-2 text-[9px] tracking-label text-ink uppercase shadow hover:bg-white">Expand ⛶</button>
      </div>
    </div>
    {typeof document !== "undefined" && createPortal(<AnimatePresence>{expanded && <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-3 md:p-6" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} onClick={() => setExpanded(false)}><motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Expanded ${active === "model" ? "3D view" : active} for ${title}`} className="relative h-full w-full max-w-7xl overflow-hidden bg-ink" initial={reduceMotion ? false : { opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, scale: .98 }} onClick={(event) => event.stopPropagation()}>{renderActive(true)}<button type="button" onClick={() => setExpanded(false)} aria-label="Close expanded media" className="absolute right-4 top-4 z-30 bg-cream px-4 py-3 text-[10px] tracking-label text-ink uppercase shadow">Close ×</button></motion.div></motion.div>}</AnimatePresence>, document.body)}
  </>;
}

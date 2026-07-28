"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { museumToast } from "@/lib/museum-toast";

type ModelElement = HTMLElement & {
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  resetTurntableRotation?: () => void;
};

export default function ArtifactModelViewer({ src, poster, title, className = "" }: { src: string; poster?: string; title: string; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelElement>(null);
  const failureNotifiedRef = useRef(false);
  const [nearView, setNearView] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rotating, setRotating] = useState(false);

  const reportFailure = useCallback(() => {
    setFailed(true);
    if (failureNotifiedRef.current) return;
    failureNotifiedRef.current = true;
    museumToast.error(
      "3D model unavailable",
      `${title} could not be loaded. The model file may be missing or no longer available.`,
    );
  }, [title]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNearView(true), { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearView || ready) return;
    let active = true;
    import("@google/model-viewer").then(() => active && setReady(true)).catch(() => active && reportFailure());
    return () => { active = false; };
  }, [nearView, ready, reportFailure]);

  if (failed) return <div role="alert" className={`flex h-full items-center justify-center bg-cream-dark p-8 text-center ${className}`}><div><p className="font-display text-2xl italic">The model is unavailable</p><p className="mt-3 text-sm text-stone">We couldn’t prepare this 3D view. Try the artifact photo instead.</p></div></div>;

  return (
    <div ref={rootRef} className={`relative h-full w-full bg-cream-dark ${className}`} onPointerDown={() => setNearView(true)}>
      {ready ? (
        <model-viewer
          ref={viewerRef}
          src={src}
          alt={`Interactive 3D model of ${title}`}
          poster={poster}
          camera-controls
          touch-action="pan-y"
          ar
          ar-modes="webxr scene-viewer quick-look"
          auto-rotate={rotating || undefined}
          interaction-prompt="when-focused"
          loading="eager"
          reveal="auto"
          shadow-intensity="0.8"
          style={{ width: "100%", height: "100%", background: "transparent" }}
          onLoad={() => { setLoaded(true); setProgress(100); }}
          onError={reportFailure}
          onProgress={(event) => setProgress(Math.round((event as CustomEvent<{ totalProgress: number }>).detail.totalProgress * 100))}
        >
          <button slot="ar-button" type="button" className="absolute right-3 top-3 bg-cream/95 px-4 py-2 text-[10px] tracking-label text-ink uppercase shadow">View in AR</button>
        </model-viewer>
      ) : poster ? <PlaceholderImage src={poster} alt={title} label={title} sizes="(min-width: 768px) 50vw, 100vw" /> : null}
      {!loaded && <div className="pointer-events-none absolute inset-x-5 bottom-5" role="status" aria-label={`Loading 3D model: ${progress}%`}><div className="h-px bg-ink/20"><span className="block h-full bg-ink transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[9px] tracking-label text-stone uppercase">Preparing 3D view · {progress}%</p></div>}
      {loaded && <div className="absolute bottom-3 left-3 flex gap-2"><button type="button" aria-pressed={rotating} onClick={() => setRotating((value) => !value)} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">{rotating ? "Stop rotation" : "Auto rotate"}</button><button type="button" onClick={() => { const viewer = viewerRef.current; viewer?.resetTurntableRotation?.(); if (viewer) { viewer.cameraOrbit = "auto auto auto"; viewer.cameraTarget = "auto auto auto"; viewer.fieldOfView = "auto"; } }} className="bg-cream/95 px-3 py-2 text-[9px] tracking-label uppercase shadow">Reset view</button></div>}
    </div>
  );
}

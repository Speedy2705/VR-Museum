"use client";

import { useEffect, useRef, useState } from "react";

type ArModelElement = HTMLElement & { activateAR: () => Promise<void> };

export default function AmbientArView({ src, alt }: { src: string; alt: string }) {
  const viewerRef = useRef<ArModelElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; import("@google/model-viewer").then(() => active && setReady(true)).catch(() => undefined); return () => { active = false; }; }, []);
  return <><model-viewer ref={viewerRef} src={src} alt={alt} ar ar-modes="webxr scene-viewer quick-look" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} /><button type="button" disabled={!ready} onClick={() => void viewerRef.current?.activateAR()} className="bg-cream/95 px-4 py-2 text-[10px] tracking-label text-ink uppercase shadow disabled:opacity-50">View in AR</button></>;
}

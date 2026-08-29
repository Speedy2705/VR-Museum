"use client";

import dynamic from "next/dynamic";
import { useId, useState, type ReactNode } from "react";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import ArtifactStageFullscreen from "./ArtifactStageFullscreen";
import { keyFromDisplayName } from "@/lib/lighting-presets";
import type { MuseumPanelDetails } from "@/lib/three/museum-environment";
import { getExhibitDisplayStyle } from "@/lib/artifact-categories";

const VideoPlayer = dynamic(() => import("./ArtifactVideoPlayer"), { ssr: false, loading: () => <MediaLoading label="Preparing video" /> });
const ModelViewer = dynamic(() => import("./LightingStudioViewer"), { ssr: false, loading: () => <MediaLoading label="Preparing 3D view" /> });
type MediaKind = "image" | "video" | "model";
type Props = { title: string; image?: string; video?: string; model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" | "usdz" }; lighting?: string | null; primaryMediaType?: MediaKind; fullscreen?: boolean; overlay?: ReactNode; overlayActions?: ReactNode; immersiveDetails?: boolean; plaqueOrigin?: string; panelDetails?: MuseumPanelDetails; exhibitCategory?: string; exhibitMaterial?: string };

function MediaLoading({ label }: { label: string }) { return <div className="flex h-full items-center justify-center bg-cream-dark text-xs tracking-label text-stone uppercase">{label}…</div>; }

export default function ArtifactMediaStage({ title, image, video, model, lighting, primaryMediaType = "image", fullscreen = false, overlay, overlayActions, immersiveDetails = false, plaqueOrigin, panelDetails, exhibitCategory, exhibitMaterial }: Props) {
  const available: MediaKind[] = immersiveDetails && model
    ? ["model"]
    : fullscreen && primaryMediaType === "video" && video
      ? ["video"]
      : ["image", ...(video ? ["video" as const] : []), ...(model ? ["model" as const] : [])];
  const [active, setActive] = useState<MediaKind>(available.includes(primaryMediaType) ? primaryMediaType : "image");
  const tabsId = useId();
  const renderActive = () => {
    if (active === "video" && video) return <VideoPlayer src={video} poster={image} title={title} />;
    if (active === "model" && model && model.format !== "usdz") return <ModelViewer src={model.url} format={model.format} presetKey={keyFromDisplayName(lighting)} poster={image} title={title} museumLayout={immersiveDetails ? "details" : "centered"} plaqueOrigin={plaqueOrigin} panelDetails={panelDetails} displayStyle={getExhibitDisplayStyle(exhibitCategory, exhibitMaterial)} />;
    return <PlaceholderImage src={image} alt={title} label={title} sizes={fullscreen ? "100vw" : "(min-width: 768px) 50vw, 100vw"} fill={fullscreen} fit="contain" />;
  };
  const tabs = available.length > 1 && <div role="tablist" aria-label="Artifact media" className="mb-4 flex border border-line bg-cream-dark p-1">{available.map((kind) => <button key={kind} id={`${tabsId}-${kind}`} type="button" role="tab" aria-selected={active === kind} aria-controls={`${tabsId}-panel`} onClick={() => setActive(kind)} className={`flex-1 px-3 py-2 text-xs tracking-label uppercase transition-colors ${active === kind ? "bg-ink text-cream" : "text-stone hover:bg-cream"}`}>{kind === "model" ? "3D View" : kind === "image" ? "Photo" : "Video"}</button>)}</div>;
  const panel = <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${active}`} className={fullscreen ? "h-full w-full" : "relative aspect-[4/5] w-full overflow-hidden bg-cream-dark"}>{renderActive()}</div>;
  if (fullscreen) return <ArtifactStageFullscreen viewer={panel} overlay={<>{tabs}{overlay}</>} overlayActions={overlayActions} immersiveDetails={immersiveDetails} splitDetails={active === "video"} />;
  return <div className="w-full">{tabs}{panel}</div>;
}

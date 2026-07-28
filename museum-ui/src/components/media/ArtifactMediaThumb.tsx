"use client";

import PlaceholderImage from "@/components/ui/PlaceholderImage";
import Tag from "@/components/ui/Tag";
import type { MarketplaceView } from "@/types/catalog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { museumToast } from "@/lib/museum-toast";

type MediaType = NonNullable<MarketplaceView["primaryMediaType"]>;
type ModelMedia = MarketplaceView["model"];

type ArtifactMediaThumbProps = {
  image?: string;
  video?: string;
  model?: ModelMedia;
  primaryMediaType?: MediaType;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  compact?: boolean;
};

const HOVER_DELAY_MS = 175;

function MediaBadge({ type }: { type: "video" | "model" }) {
  return (
    <Tag className="pointer-events-none absolute top-2 right-2 z-20 flex items-center gap-1 bg-cream/90 px-2 py-1 shadow-sm">
      {type === "video" ? "▶ Video" : "◇ 360°"}
    </Tag>
  );
}

export default function ArtifactMediaThumb({
  image,
  video,
  model,
  primaryMediaType,
  alt,
  className = "",
  sizes,
  priority,
  compact = false,
}: ArtifactMediaThumbProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const hovered = useRef(false);
  const unavailableNotified = useRef(false);
  const loadFailureNotified = useRef(false);
  const [finePointer, setFinePointer] = useState(false);
  const [inView, setInView] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [modelViewerReady, setModelViewerReady] = useState(false);

  const availableType =
    primaryMediaType === "video" && video
      ? "video"
      : primaryMediaType === "model" && model
        ? "model"
        : video
          ? "video"
          : model
            ? "model"
            : null;
  const canPreview = Boolean(availableType && finePointer && inView && !reduceMotion);
  const showPreview = previewing && canPreview;

  useEffect(() => {
    unavailableNotified.current = false;
    loadFailureNotified.current = false;
  }, [alt, model, video]);

  const reportLoadFailure = useCallback(() => {
    setPreviewing(false);
    if (loadFailureNotified.current) return;
    loadFailureNotified.current = true;
    museumToast.error(
      "Preview unavailable",
      `${alt}'s ${availableType === "video" ? "video" : "3D model"} file could not be loaded. The artifact photo is still available.`,
    );
  }, [alt, availableType]);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showPreview || availableType !== "model" || modelViewerReady) return;
    let active = true;
    import("@google/model-viewer").then(() => {
      if (active) setModelViewerReady(true);
    });
    return () => {
      active = false;
    };
  }, [availableType, modelViewerReady, showPreview]);

  const startPreview = () => {
    hovered.current = true;
    if (!finePointer || !inView || hoverTimer.current !== null) return;
    hoverTimer.current = window.setTimeout(() => {
      if (!hovered.current) return;
      if (!availableType) {
        if (!unavailableNotified.current) {
          unavailableNotified.current = true;
          museumToast.info(
            "Preview unavailable",
            `${alt} does not have a 3D model or video yet. The artifact photo is still available.`,
          );
        }
      } else if (!reduceMotion) {
        setPreviewing(true);
      }
      hoverTimer.current = null;
    }, HOVER_DELAY_MS);
  };

  const stopPreview = () => {
    hovered.current = false;
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setPreviewing(false);
  };

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      onPointerEnter={startPreview}
      onPointerLeave={stopPreview}
    >
      <motion.div
        className="absolute inset-0"
        animate={
          showPreview
            ? { opacity: 0.28, scale: compact ? 0.99 : 0.975 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <PlaceholderImage
          src={image}
          alt={alt}
          label={alt}
          sizes={sizes}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none"
        />
      </motion.div>

      <AnimatePresence>
        {showPreview && availableType && (
          <motion.div
            key={availableType}
            className="absolute inset-0 z-10 bg-ink/5"
            initial={{ opacity: 0, scale: compact ? 1.015 : 1.035 }}
            animate={{ opacity: 1, scale: compact ? 1.005 : 1.015 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            {availableType === "video" && video ? (
              <video
                src={video}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={`${alt} video preview`}
                onError={reportLoadFailure}
              />
            ) : availableType === "model" && model && modelViewerReady ? (
              <model-viewer
                src={model.url}
                alt={`${alt} 3D preview`}
                auto-rotate
                interaction-prompt="none"
                loading="eager"
                reveal="auto"
                camera-orbit="30deg 75deg auto"
                style={{ width: "100%", height: "100%", background: "transparent" }}
                onError={reportLoadFailure}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {availableType && <MediaBadge type={availableType} />}
    </div>
  );
}

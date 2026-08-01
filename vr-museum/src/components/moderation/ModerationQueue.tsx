"use client";

import { useState } from "react";
import LightingPresetPicker from "@/components/media/LightingPresetPicker";
import LightingStudioViewer from "@/components/media/LightingStudioViewer";
import ArtifactStageFullscreen from "@/components/media/ArtifactStageFullscreen";
import ModerationCommentDialog, { type CommentDecision } from "@/components/moderation/ModerationCommentDialog";
import { getCategoryByKey, type CollectionSlug, type LightDirectionKey, type LightTemperatureKey } from "@/lib/artifact-categories";
import { notifyError } from "@/lib/client-error";
import { getLightDirection, getLightTemperature } from "@/lib/lighting-presets";
import { museumToast } from "@/lib/museum-toast";
import type { ModelFormat } from "@/lib/three/loaders";

type ModerationItem = {
  id: string;
  title: string;
  category: CollectionSlug;
  ownerName: string;
  ownerEmail: string;
  lightTemperature: LightTemperatureKey | null;
  lightDirection: LightDirectionKey | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  mediaType: "MODEL_3D" | "VIDEO";
  modelFormat: ModelFormat | null;
  description: string;
  origin: string;
  material: string;
  license: string;
  price: number | null;
};

type DialogState = { id: string; decision: CommentDecision } | null;

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3.5 sm:flex-row sm:items-start sm:gap-8">
      <span className="text-[10px] tracking-label uppercase text-stone">{label}</span>
      <span className="text-sm leading-relaxed text-ink sm:max-w-[70%] sm:text-right">{children || "—"}</span>
    </div>
  );
}

export default function ModerationQueue({ initialItems }: { initialItems: ModerationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [previewTemperatures, setPreviewTemperatures] = useState<Record<string, LightTemperatureKey>>({});
  const [previewDirections, setPreviewDirections] = useState<Record<string, LightDirectionKey>>({});

  async function moderate(id: string, status: "APPROVED" | CommentDecision, comment?: string) {
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(`/api/moderation/uploads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(comment ? { comment } : {}) }),
      });
      if (!response.ok) throw new Error();
      setItems((current) => current.filter((item) => item.id !== id));
      setExpandedId((current) => current === id ? null : current);
      const title = status === "APPROVED" ? "Upload approved" : status === "CHANGES_REQUESTED" ? "Changes requested" : "Upload rejected";
      museumToast.success(title, "The contributor’s moderation queue has been updated.");
      setDialog(null);
    } catch (moderationError) {
      setError(notifyError(moderationError, "The moderation action could not be completed."));
    } finally {
      setPendingId("");
    }
  }

  if (!items.length) {
    return <p className="border border-line bg-cream-dark px-6 py-8 text-sm text-stone">No uploads are awaiting review.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const categoryName = getCategoryByKey(item.category)?.name ?? item.category;
        const previewTemperature = previewTemperatures[item.id] ?? item.lightTemperature;
        const previewDirection = previewDirections[item.id] ?? item.lightDirection;
        return (
          <article key={item.id} className="border border-line">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`moderation-detail-${item.id}`}
              onClick={() => setExpandedId(expanded ? null : item.id)}
              className="flex w-full flex-col justify-between gap-5 p-6 text-left hover:bg-cream-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center"
            >
              <span>
                <span className="text-[9px] tracking-label uppercase text-stone">{categoryName}</span>
                <span className="font-display mt-2 block text-xl">{item.title}</span>
                <span className="mt-2 block text-xs text-stone">{item.ownerName} · {item.ownerEmail}</span>
              </span>
              <span className="text-[10px] tracking-label uppercase text-stone">{expanded ? "Close details −" : "Review upload +"}</span>
            </button>

            {expanded && (
              <div id={`moderation-detail-${item.id}`} className="border-t border-line" tabIndex={-1}>
                <ArtifactStageFullscreen
                  studioSplit
                  overlayLabel={`Moderation controls for ${item.title}`}
                  viewer={item.mediaType === "MODEL_3D" && previewTemperature && previewDirection && item.modelFormat
                    ? <LightingStudioViewer src={item.fileUrl} format={item.modelFormat} lightTemperature={previewTemperature} lightDirection={previewDirection} title={item.title} poster={item.thumbnailUrl ?? undefined} />
                    : <video className="h-full w-full bg-black object-contain" controls poster={item.thumbnailUrl ?? undefined} src={item.fileUrl}>Your browser does not support video playback.</video>}
                  overlay={<div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] tracking-label uppercase text-stone">Curator review · {categoryName}</p>
                        <h2 className="font-display mt-3 text-3xl italic">{item.title}</h2>
                        <p className="mt-2 text-xs leading-relaxed text-stone">Submitted by {item.ownerName} · {item.ownerEmail}</p>
                      </div>
                      <button type="button" onClick={() => setExpandedId(null)} className="shrink-0 text-[10px] tracking-label uppercase text-stone hover:text-ink">Close ×</button>
                    </div>
                    {previewTemperature && previewDirection && <div className="mt-6"><p className="text-xs leading-relaxed text-stone">Preview the model under each museum lighting combination before making a decision.</p><span className="mt-4 inline-block border border-line bg-cream-dark px-3 py-1.5 text-[9px] tracking-label uppercase text-charcoal">Contributor&apos;s choice: {getLightTemperature(item.lightTemperature ?? previewTemperature).name} · {getLightDirection(item.lightDirection ?? previewDirection).name}</span><div className="mt-5"><LightingPresetPicker stepped temperature={previewTemperature} direction={previewDirection} onTemperatureChange={(value) => setPreviewTemperatures((current) => ({ ...current, [item.id]: value }))} onDirectionChange={(value) => setPreviewDirections((current) => ({ ...current, [item.id]: value }))} /></div></div>}
                    <div className="mt-6 divide-y divide-line border-y border-line">
                  <DetailRow label="Public Description">{item.description}</DetailRow>
                  <DetailRow label="Origin / Provenance">{item.origin}</DetailRow>
                  <DetailRow label="Primary Material">{item.material}</DetailRow>
                  <DetailRow label="Category">{categoryName}</DetailRow>
                  <DetailRow label="License">{item.license}</DetailRow>
                  <DetailRow label="Price">{item.price === null ? "Free" : `$${item.price.toFixed(2)}`}</DetailRow>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <button type="button" disabled={pendingId === item.id} onClick={() => setDialog({ id: item.id, decision: "REJECTED" })} className="border border-red-900 px-5 py-2.5 text-[10px] tracking-label uppercase text-red-900 hover:bg-red-900 hover:text-white disabled:opacity-50">Reject</button>
                  <button type="button" disabled={pendingId === item.id} onClick={() => setDialog({ id: item.id, decision: "CHANGES_REQUESTED" })} className="border border-line px-5 py-2.5 text-[10px] tracking-label uppercase hover:border-ink disabled:opacity-50">Request Changes</button>
                  <button type="button" disabled={pendingId === item.id} onClick={() => moderate(item.id, "APPROVED")} className="bg-ink px-5 py-2.5 text-[10px] tracking-label uppercase text-cream hover:bg-charcoal disabled:opacity-50">Approve</button>
                    </div>
                  </div>}
                />
              </div>
            )}
          </article>
        );
      })}
      {dialog && (
        <ModerationCommentDialog
          open
          decision={dialog.decision}
          pending={pendingId === dialog.id}
          onCancel={() => setDialog(null)}
          onConfirm={(comment) => moderate(dialog.id, dialog.decision, comment)}
        />
      )}
    </div>
  );
}

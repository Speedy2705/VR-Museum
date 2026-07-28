"use client";

import Image from "next/image";
import { useState } from "react";
import LightingPresetPicker from "@/components/media/LightingPresetPicker";
import LightingStudioViewer from "@/components/media/LightingStudioViewer";
import ModerationCommentDialog, { type CommentDecision } from "@/components/moderation/ModerationCommentDialog";
import { getCategoryByKey, type CollectionSlug, type LightingPresetKey } from "@/lib/artifact-categories";
import { notifyError } from "@/lib/client-error";
import { getLightingPreset } from "@/lib/lighting-presets";
import { museumToast } from "@/lib/museum-toast";
import type { ModelFormat } from "@/lib/three/loaders";

type ModerationItem = {
  id: string;
  title: string;
  category: CollectionSlug;
  ownerName: string;
  ownerEmail: string;
  lightingPreset: LightingPresetKey | null;
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
  const [previewPresets, setPreviewPresets] = useState<Record<string, LightingPresetKey>>({});

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
        const submittedPreset = item.lightingPreset;
        const previewPreset = submittedPreset ? previewPresets[item.id] ?? submittedPreset : null;
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
              <div id={`moderation-detail-${item.id}`} className="border-t border-line p-6" tabIndex={-1}>
                {item.mediaType === "MODEL_3D" && previewPreset && item.modelFormat && (
                  <div>
                    <LightingStudioViewer src={item.fileUrl} format={item.modelFormat} presetKey={previewPreset} title={item.title} poster={item.thumbnailUrl ?? undefined} className="aspect-[4/3]" />
                    <div className="mt-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[10px] tracking-label uppercase text-stone">Curator lighting preview</p>
                        <span className="border border-line bg-cream-dark px-3 py-1.5 text-[9px] tracking-label uppercase text-charcoal">
                          Artist&apos;s choice: {getLightingPreset(submittedPreset!).name}
                        </span>
                      </div>
                      <LightingPresetPicker value={previewPreset} onChange={(preset) => setPreviewPresets((current) => ({ ...current, [item.id]: preset }))} />
                      {previewPreset !== submittedPreset && (
                        <button type="button" onClick={() => setPreviewPresets((current) => ({ ...current, [item.id]: submittedPreset! }))} className="mt-4 text-[10px] tracking-label uppercase text-stone underline underline-offset-4">
                          Reset to artist&apos;s choice
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {item.mediaType === "VIDEO" && (
                  <video className="aspect-video w-full bg-black object-contain" controls src={item.fileUrl}>Your browser does not support video playback.</video>
                )}

                <div className="mt-8">
                  <p className="mb-3 text-[10px] tracking-label uppercase text-stone">Display Photo</p>
                  {item.thumbnailUrl ? (
                    <div className="relative aspect-video overflow-hidden bg-cream-dark"><Image src={item.thumbnailUrl} alt={`Display photo for ${item.title}`} fill sizes="(min-width: 1024px) 896px, 100vw" className="object-contain" /></div>
                  ) : <p className="bg-cream-dark px-5 py-8 text-sm text-stone">No display photo was submitted.</p>}
                </div>

                <div className="mt-8 divide-y divide-line border-t border-b border-line">
                  <DetailRow label="Public Description">{item.description}</DetailRow>
                  <DetailRow label="Origin / Provenance">{item.origin}</DetailRow>
                  <DetailRow label="Primary Material">{item.material}</DetailRow>
                  <DetailRow label="Category">{categoryName}</DetailRow>
                  <DetailRow label="License">{item.license}</DetailRow>
                  <DetailRow label="Price">{item.price === null ? "Free" : `$${item.price.toFixed(2)}`}</DetailRow>
                </div>

                <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-line pt-6">
                  <button type="button" disabled={pendingId === item.id} onClick={() => setDialog({ id: item.id, decision: "REJECTED" })} className="border border-red-900 px-5 py-2.5 text-[10px] tracking-label uppercase text-red-900 hover:bg-red-900 hover:text-white disabled:opacity-50">Reject</button>
                  <button type="button" disabled={pendingId === item.id} onClick={() => setDialog({ id: item.id, decision: "CHANGES_REQUESTED" })} className="border border-line px-5 py-2.5 text-[10px] tracking-label uppercase hover:border-ink disabled:opacity-50">Request Changes</button>
                  <button type="button" disabled={pendingId === item.id} onClick={() => moderate(item.id, "APPROVED")} className="bg-ink px-5 py-2.5 text-[10px] tracking-label uppercase text-white disabled:opacity-50">Approve</button>
                </div>
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

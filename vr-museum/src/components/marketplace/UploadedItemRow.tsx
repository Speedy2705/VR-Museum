"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ArtifactMediaThumb from "@/components/media/ArtifactMediaThumb";
import LightingPresetPicker from "@/components/media/LightingPresetPicker";
import LightingStudioViewer from "@/components/media/LightingStudioViewer";
import ArtifactStageFullscreen from "@/components/media/ArtifactStageFullscreen";
import { ARTIFACT_CATEGORIES, getDefaultLightingForCategory, type CollectionSlug, type LightingPresetKey } from "@/lib/artifact-categories";
import { MODEL_FILE_ACCEPT, VIDEO_FILE_ACCEPT, modelFormatFromExtension, extensionOf, validateUploadFile } from "@/lib/upload-file-policy";
import { museumToast } from "@/lib/museum-toast";
import type { UploadedAssetView } from "@/types/catalog";

export default function UploadedItemRow({ asset }: { asset: UploadedAssetView }) {
  const [current, setCurrent] = useState(asset);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(asset.title);
  const [category, setCategory] = useState<CollectionSlug>((asset.collectionSlug ?? asset.material) as CollectionSlug);
  const [period, setPeriod] = useState(asset.period);
  const [license, setLicense] = useState(asset.license);
  const [priceMode, setPriceMode] = useState<"free" | "paid">(asset.price === null ? "free" : "paid");
  const [price, setPrice] = useState(asset.price?.toString() ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [lighting, setLighting] = useState<LightingPresetKey>((asset.lightingPreset as LightingPresetKey | null) ?? "raking-light");
  const isLive = current.status === "live";
  const isRejected = current.status === "rejected";
  const isChangesRequested = current.status === "changes-requested";
  const isModel = current.primaryMediaType === "model";
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : current.model?.url, [file, current.model?.url]);
  const previewFormat = file ? modelFormatFromExtension(extensionOf(file.name)) : current.model?.format;
  const videoPreviewUrl = !isModel ? previewUrl ?? current.video : undefined;
  useEffect(() => () => { if (file && previewUrl) URL.revokeObjectURL(previewUrl); }, [file, previewUrl]);

  function cancelEditing() {
    setTitle(current.title); setCategory((current.collectionSlug ?? current.material) as CollectionSlug); setPeriod(current.period); setLicense(current.license);
    setPriceMode(current.price === null ? "free" : "paid"); setPrice(current.price?.toString() ?? ""); setFile(null); setPhoto(null);
    setLighting((current.lightingPreset as LightingPresetKey | null) ?? "raking-light"); setEditing(false);
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericPrice = Number(price);
    if (!title.trim() || !period.trim() || !license.trim()) return museumToast.warning("Listing details are incomplete", "Complete every field before saving.");
    if (priceMode === "paid" && (!Number.isFinite(numericPrice) || numericPrice <= 0)) return museumToast.warning("Enter a valid price", "Paid listings need a price greater than zero.");
    if (file) {
      const validation = await validateUploadFile(file, isModel ? "3d-model" : "video-scan");
      if (!validation.valid) return museumToast.error("Replacement file is invalid", validation.reason);
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.set("type", isModel ? "3d-model" : "video-scan"); form.set("title", title.trim()); form.set("category", category);
      form.set("lightingPreset", isModel ? lighting : "");
      form.set("metadata", JSON.stringify({ period: period.trim(), origin: period.trim(), license: license.trim(), price: priceMode === "paid" ? numericPrice : null }));
      if (file) form.set("file", file); if (photo) form.set("photo", photo);
      const response = await fetch(`/api/upload/${current.id}`, { method: "PATCH", body: form });
      const body = await response.json() as { success: boolean; error?: { message?: string } };
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "The listing could not be updated.");
      setCurrent((item) => ({ ...item, title: title.trim(), material: category, collectionSlug: category, period: period.trim(), license: license.trim(), price: priceMode === "paid" ? numericPrice : null, lightingPreset: isModel ? lighting : null, status: isChangesRequested ? "under-review" : item.status, curatorComment: isChangesRequested ? null : item.curatorComment, image: photo ? URL.createObjectURL(photo) : item.image, model: isModel && file && previewFormat && previewFormat !== "usdz" ? { url: URL.createObjectURL(file), format: previewFormat } : item.model, video: !isModel && file ? URL.createObjectURL(file) : item.video }));
      setEditing(false); setFile(null); setPhoto(null);
      museumToast.success(isChangesRequested ? "Changes resubmitted" : "Listing updated", isChangesRequested ? "Your artifact is back in the curator queue." : "Your changes have been saved.");
    } catch (error) { museumToast.error("Listing not updated", error instanceof Error ? error.message : "Please try again."); }
    finally { setSaving(false); }
  }

  const inputClass = "mt-2 block w-full border border-line bg-transparent px-3 py-2.5 text-sm normal-case tracking-normal text-ink outline-none focus:border-ink";
  const badge = isLive ? "Live" : isRejected ? "Rejected" : isChangesRequested ? "Changes Requested" : "Under Review";
  return <div className="border border-line px-6 py-6">
    <div className="flex items-start gap-4"><div className="relative h-16 w-16 flex-shrink-0 overflow-hidden"><ArtifactMediaThumb image={current.image} video={current.video} model={current.model} primaryMediaType={current.primaryMediaType} alt={current.title} sizes="4rem" compact /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm text-ink">{current.title}</h3><span className={`px-2 py-0.5 text-[9px] tracking-label uppercase ${isChangesRequested ? "bg-amber-100 text-amber-900" : isRejected ? "bg-red-100 text-red-900" : "bg-cream-dark text-charcoal"}`}>{badge}</span></div><p className="mt-1 text-xs text-stone">{current.period} · {current.material} · {current.license} · {current.price === null ? "Free" : `$${current.price}`}</p></div>{!isRejected && <button type="button" onClick={() => editing ? cancelEditing() : setEditing(true)} className="flex-shrink-0 border border-line px-4 py-2.5 text-[10px] tracking-label text-ink uppercase hover:bg-ink hover:text-cream">{editing ? "Cancel Edit" : isChangesRequested ? "Edit & Resubmit" : "Edit Listing"}</button>}</div>
    {editing && <form onSubmit={saveListing} className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
      <label className="text-[10px] tracking-label text-stone uppercase">Title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required className={inputClass}/></label>
      <label className="text-[10px] tracking-label text-stone uppercase">Domain<select value={category} onChange={(e) => { const next=e.target.value as CollectionSlug; setCategory(next); if(isModel) setLighting(getDefaultLightingForCategory(next)); }} className={inputClass}>{ARTIFACT_CATEGORIES.map((item)=><option key={item.key} value={item.key}>{item.name}</option>)}</select></label>
      <label className="text-[10px] tracking-label text-stone uppercase">Period / origin<input value={period} onChange={(e)=>setPeriod(e.target.value)} required className={inputClass}/></label><label className="text-[10px] tracking-label text-stone uppercase">License<input value={license} onChange={(e)=>setLicense(e.target.value)} required className={inputClass}/></label>
      <label className="text-[10px] tracking-label text-stone uppercase">Replace {isModel ? "model" : "video"} (optional)<input type="file" accept={isModel ? MODEL_FILE_ACCEPT : VIDEO_FILE_ACCEPT} onChange={(e)=>setFile(e.target.files?.[0] ?? null)} className={inputClass}/></label><label className="text-[10px] tracking-label text-stone uppercase">Replace display photo (optional)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e)=>setPhoto(e.target.files?.[0] ?? null)} className={inputClass}/></label>
      {isModel && previewUrl && previewFormat && previewFormat !== "usdz" && <div className="sm:col-span-2"><ArtifactStageFullscreen immersiveDetails viewer={<LightingStudioViewer src={previewUrl} format={previewFormat} presetKey={lighting} title={title} poster={current.image} museumLayout="details" plaqueOrigin={period} panelDetails={{ uploadType: "Your Artifact · Listing Preview", title, uploader: "Museum Contributor", description: "Preview how this artifact will appear throughout the museum.", material: category, origin: period, license, price: priceMode === "free" ? "Free" : `$${price}` }} />} overlay={<div><h3 className="font-display text-2xl italic">{title}</h3><p className="mt-3 text-sm text-stone">{period} · {category}</p><div className="mt-5"><LightingPresetPicker value={lighting} onChange={setLighting} defaultKey={getDefaultLightingForCategory(category)}/></div></div>} overlayActions={<div className="hidden md:block"><p className="text-[9px] tracking-label uppercase text-cream/60">Preview lighting</p><div className="mt-3"><LightingPresetPicker value={lighting} onChange={setLighting} defaultKey={getDefaultLightingForCategory(category)}/></div></div>} /></div>}
      {!isModel && videoPreviewUrl && <div className="sm:col-span-2"><ArtifactStageFullscreen splitDetails viewer={<video className="h-full w-full bg-black object-contain" controls src={videoPreviewUrl}>Your browser does not support video playback.</video>} overlay={<div><p className="text-[9px] tracking-label uppercase text-stone">Your Artifact · Video Preview</p><h3 className="font-display mt-3 text-3xl italic">{title}</h3><p className="mt-4 text-base leading-relaxed">{period} · {category}</p><dl className="mt-6 divide-y divide-line border-y border-line"><div className="flex justify-between py-3"><dt>License</dt><dd>{license}</dd></div><div className="flex justify-between py-3"><dt>Price</dt><dd>{priceMode === "free" ? "Free" : `$${price}`}</dd></div></dl></div>} /></div>}
      <fieldset className="sm:col-span-2"><legend className="text-[10px] tracking-label text-stone uppercase">Pricing</legend><div className="mt-2 flex gap-3"><button type="button" onClick={()=>setPriceMode("free")} className="border px-4 py-2 text-xs">Free</button><button type="button" onClick={()=>setPriceMode("paid")} className="border px-4 py-2 text-xs">Paid</button>{priceMode === "paid" && <input aria-label="Listing price" type="number" min="0.01" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} className={inputClass}/>}</div></fieldset>
      <div className="flex gap-3 sm:col-span-2"><button type="submit" disabled={saving} className="bg-ink px-6 py-3 text-[10px] tracking-label text-cream uppercase disabled:opacity-60">{saving ? "Saving…" : isChangesRequested ? "Save & Resubmit" : "Save Changes"}</button><button type="button" onClick={cancelEditing} className="border border-line px-6 py-3 text-[10px] tracking-label uppercase">Cancel</button></div>
    </form>}
    {isLive ? <div className="mt-5 grid grid-cols-2 border-t border-line"><div className="py-3"><span className="text-[9px] text-stone uppercase">Views</span><p>{current.views}</p></div><div className="py-3"><span className="text-[9px] text-stone uppercase">Earnings</span><p>{current.earnings === null ? "—" : `$${current.earnings}`}</p></div></div> : <div className="mt-5 border-t border-line pt-4">{(isChangesRequested || isRejected) && current.curatorComment ? <blockquote className={`border-l-2 px-4 py-3 text-xs leading-relaxed ${isRejected ? "border-red-500 bg-red-50 text-red-900" : "border-amber-500 bg-amber-50 text-amber-950"}`}>“{current.curatorComment}”</blockquote> : <p className="bg-cream-dark px-4 py-3 text-xs text-charcoal/70">This artifact is being reviewed by museum staff. It will go live within 3–5 working days.</p>}</div>}
    <p className="mt-3 text-[10px] text-stone-light">Uploaded {current.uploadedDate}</p>
  </div>;
}

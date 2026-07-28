"use client";

import { useState, type FormEvent } from "react";
import ArtifactMediaThumb from "@/components/media/ArtifactMediaThumb";
import { museumToast } from "@/lib/museum-toast";
import type { UploadedAssetView } from "@/types/catalog";

export default function UploadedItemRow({ asset }: { asset: UploadedAssetView }) {
  const [current, setCurrent] = useState(asset);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(asset.title);
  const [category, setCategory] = useState(asset.material);
  const [period, setPeriod] = useState(asset.period);
  const [license, setLicense] = useState(asset.license);
  const [priceMode, setPriceMode] = useState<"free" | "paid">(asset.price === null ? "free" : "paid");
  const [price, setPrice] = useState(asset.price?.toString() ?? "");
  const isLive = current.status === "live";
  const isRejected = current.status === "rejected";

  function cancelEditing() {
    setTitle(current.title);
    setCategory(current.material);
    setPeriod(current.period);
    setLicense(current.license);
    setPriceMode(current.price === null ? "free" : "paid");
    setPrice(current.price?.toString() ?? "");
    setEditing(false);
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericPrice = Number(price);
    if (!title.trim() || !category.trim() || !period.trim() || !license.trim()) {
      museumToast.warning("Listing details are incomplete", "Complete every field before saving.");
      return;
    }
    if (priceMode === "paid" && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
      museumToast.warning("Enter a valid price", "Paid listings need a price greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/upload/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          metadata: {
            period: period.trim(),
            license: license.trim(),
            price: priceMode === "paid" ? numericPrice : null,
          },
        }),
      });
      const body = await response.json() as { success: boolean; error?: { message?: string } };
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "The listing could not be updated.");
      }
      setCurrent((item) => ({
        ...item,
        title: title.trim(),
        material: category.trim(),
        period: period.trim(),
        license: license.trim(),
        price: priceMode === "paid" ? numericPrice : null,
        status: item.status === "rejected" ? "under-review" : item.status,
      }));
      setEditing(false);
      museumToast.success("Listing updated", "Your changes are now reflected in the marketplace.");
    } catch (error) {
      museumToast.error("Listing not updated", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-2 block w-full border border-line bg-transparent px-3 py-2.5 text-sm normal-case tracking-normal text-ink outline-none focus:border-ink";

  return (
    <div className="border border-line px-6 py-6">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden">
          <ArtifactMediaThumb image={current.image} video={current.video} model={current.model} primaryMediaType={current.primaryMediaType} alt={current.title} sizes="4rem" compact />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm text-ink">{current.title}</h3>
            <span className={`px-2 py-0.5 text-[9px] tracking-label uppercase ${isLive ? "bg-cream-dark text-charcoal" : "bg-stone-light/40 text-charcoal"}`}>
              {isLive ? "Live" : isRejected ? "Rejected" : "Under Review"}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone">
            {current.period} · {current.material} · {current.license} · {current.price === null ? "Free" : `$${current.price}`}
          </p>
        </div>
        <button type="button" onClick={() => editing ? cancelEditing() : setEditing(true)} className="flex-shrink-0 border border-line px-4 py-2.5 text-[10px] tracking-label text-ink uppercase hover:bg-ink hover:text-cream">
          {editing ? "Cancel Edit" : "Edit Listing"}
        </button>
      </div>

      {editing && (
        <form onSubmit={saveListing} className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <label className="text-[10px] tracking-label text-stone uppercase">Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required className={inputClass} /></label>
          <label className="text-[10px] tracking-label text-stone uppercase">Category / material<input value={category} onChange={(event) => setCategory(event.target.value)} maxLength={100} required className={inputClass} /></label>
          <label className="text-[10px] tracking-label text-stone uppercase">Period / origin<input value={period} onChange={(event) => setPeriod(event.target.value)} required className={inputClass} /></label>
          <label className="text-[10px] tracking-label text-stone uppercase">License<input value={license} onChange={(event) => setLicense(event.target.value)} maxLength={100} required className={inputClass} /></label>
          <fieldset className="sm:col-span-2">
            <legend className="text-[10px] tracking-label text-stone uppercase">Pricing</legend>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setPriceMode("free")} className={`border px-4 py-2 text-[10px] tracking-label uppercase ${priceMode === "free" ? "border-ink bg-ink text-cream" : "border-line"}`}>Free</button>
              <button type="button" onClick={() => setPriceMode("paid")} className={`border px-4 py-2 text-[10px] tracking-label uppercase ${priceMode === "paid" ? "border-ink bg-ink text-cream" : "border-line"}`}>Paid</button>
              {priceMode === "paid" && <label className="flex items-center border border-line px-3"><span className="text-stone">$</span><input type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required className="w-32 bg-transparent px-2 py-2 text-sm outline-none" aria-label="Listing price" /></label>}
            </div>
          </fieldset>
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className="bg-ink px-6 py-3 text-[10px] tracking-label text-cream uppercase disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
            <button type="button" onClick={cancelEditing} disabled={saving} className="border border-line px-6 py-3 text-[10px] tracking-label uppercase">Cancel</button>
          </div>
        </form>
      )}

      {isLive ? (
        <div className="mt-5 grid grid-cols-1 divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3.5 first:pl-0"><span className="text-[9px] tracking-label text-stone uppercase">Views</span><p className="font-display mt-1 text-xl italic">{current.views}</p></div>
          <div className="px-4 py-3.5"><span className="text-[9px] tracking-label text-stone uppercase">Earnings</span><p className="font-display mt-1 text-xl italic">{current.earnings === null ? "—" : `$${current.earnings}`}</p></div>
        </div>
      ) : (
        <div className="mt-5 border-t border-line pt-4"><p className="bg-cream-dark px-4 py-3 text-xs leading-relaxed text-charcoal/70">{isRejected ? "This artifact was not approved. Review its details before submitting a revised upload." : "This artifact is being reviewed by museum staff with the Curator role. It will go live within 3–5 working days."}</p></div>
      )}
      <p className="mt-3 text-[10px] text-stone-light">Uploaded {current.uploadedDate}</p>
    </div>
  );
}

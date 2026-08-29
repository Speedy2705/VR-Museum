import ArtifactMediaThumb from "@/components/media/ArtifactMediaThumb";
import type { PurchasedAssetView } from "@/types/catalog";
import Link from "next/link";

type PurchasedItemRowProps = {
  asset: PurchasedAssetView;
};

export default function PurchasedItemRow({ asset }: PurchasedItemRowProps) {
  return (
    <div className="flex items-start gap-4 border-r border-b border-line px-6 py-6">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden">
        <ArtifactMediaThumb
          image={asset.image}
          video={asset.video}
          model={asset.model}
          primaryMediaType={asset.primaryMediaType}
          alt={asset.title}
          sizes="4rem"
          compact
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm text-ink">{asset.title}</h3>
        <p className="mt-1 text-xs text-stone">
          by {asset.artist} · {asset.period}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span data-no-translate className="border border-line px-2 py-1 text-xs tracking-label text-stone uppercase">
            {asset.license}
          </span>
          {asset.formats.map((f) => (
            <span
              key={f}
              className="border border-line px-2 py-1 text-xs tracking-label text-stone uppercase"
            >
              {f}
            </span>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-stone-light">
          Acquired {asset.acquiredDate}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/marketplace/${asset.slug}`} className="border border-line px-3 py-2 text-xs tracking-label uppercase">View details</Link>
          {asset.model && <Link href={`/vr/${asset.slug}`} className="bg-ink px-3 py-2 text-xs tracking-label text-cream uppercase">Open 3D gallery</Link>}
        </div>
      </div>

    </div>
  );
}

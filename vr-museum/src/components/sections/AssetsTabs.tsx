"use client";

import { useState } from "react";
import Link from "next/link";
import PurchasedItemRow from "@/components/marketplace/PurchasedItemRow";
import UploadedItemRow from "@/components/marketplace/UploadedItemRow";
import type {
  PurchasedAssetView,
  UploadedAssetView,
} from "@/types/catalog";
import EmptyState from "@/components/ui/EmptyState";
import { useRole } from "@/hooks/useRole";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Tab = "purchased" | "uploaded";

type AssetsTabsProps = {
  purchased: PurchasedAssetView[];
  uploaded: UploadedAssetView[];
};

const uploadIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AssetsTabs({ purchased, uploaded }: AssetsTabsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [tab, setTabState] = useState<Tab>(searchParams.get("tab") === "uploaded" ? "uploaded" : "purchased");
  const { canUpload } = useRole();
  const setTab = (next: Tab) => {
    setTabState(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="bg-cream px-10 py-10 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-7">
            <button
              type="button"
              onClick={() => setTab("purchased")}
              className={`text-sm ${
                tab === "purchased"
                  ? "border-b-2 border-ink pb-4 -mb-4 text-ink"
                  : "text-stone hover:text-ink"
              }`}
            >
              Purchased ({purchased.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("uploaded")}
              className={`text-sm ${
                tab === "uploaded"
                  ? "border-b-2 border-ink pb-4 -mb-4 text-ink"
                  : "text-stone hover:text-ink"
              }`}
            >
              Uploaded ({uploaded.length})
            </button>
          </div>

          {canUpload && <Link
            href="/upload"
            className="flex items-center gap-1.5 text-xs tracking-label text-stone uppercase hover:text-ink"
          >
            {uploadIcon} Upload New
          </Link>}
        </div>

        {tab === "purchased" ? (
          purchased.length ? (
          <div className="mt-8 grid grid-cols-1 border-t border-l border-line sm:grid-cols-2">
            {purchased.map((asset) => (
              <PurchasedItemRow key={asset.slug} asset={asset} />
            ))}
          </div>
          ) : (
            <div className="mt-8">
              <EmptyState title="No purchased assets yet" message="Models you acquire from the marketplace will appear here." action={{ label: "Browse Marketplace", href: "/marketplace" }} />
            </div>
          )
        ) : (
          uploaded.length ? (
          <div className="mt-8 flex flex-col gap-5">
            {uploaded.map((asset) => (
              <UploadedItemRow key={asset.slug} asset={asset} />
            ))}
            {canUpload && <Link
              href="/upload"
              className="mt-3 inline-flex w-fit items-center gap-2 bg-ink px-7 py-3.5 text-xs tracking-label text-cream uppercase hover:bg-charcoal"
            >
              {uploadIcon} Upload Another Artifact
            </Link>}
          </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="No uploaded artifacts yet"
                message={canUpload ? "Contribute your first scan or 3D model to the virtual museum." : "Your role includes purchasing and collecting artifacts, but not uploading."}
                action={canUpload ? { label: "Upload Artifact", href: "/upload" } : undefined}
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}

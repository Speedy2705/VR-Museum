"use client";

import Button from "@/components/ui/Button";
import { useRole } from "@/hooks/useRole";

export default function MarketplaceCTABanner() {
  const { canSell } = useRole();
  if (!canSell) return null;

  return (
    <section className="bg-ink px-6 py-20 text-center">
      <p className="text-[11px] tracking-[0.35em] text-white/45 uppercase">
        For Artists &amp; Curators
      </p>
      <h2 className="font-display mx-auto mt-6 max-w-lg text-3xl text-white italic md:text-4xl">
        List your models on the marketplace
      </h2>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/55">
        Upload your 3D artifact scans, set your price, choose a license, and
        reach researchers, institutions, and collectors worldwide.
      </p>
      <div className="mt-8 flex justify-center">
        <Button href="/upload" variant="outline">
          Upload &amp; List Artifact
        </Button>
      </div>
    </section>
  );
}

"use client";

import Button from "@/components/ui/Button";
import { useRole } from "@/hooks/useRole";

export default function MarketplaceCTABanner() {
  const { canSell } = useRole();
  if (!canSell) return null;

  return (
    <section className="bg-ink px-6 py-20 text-center">
      <p className="text-xs tracking-[0.35em] text-white/45 uppercase">
        For Artists, Archaeologists &amp; Curators
      </p>
      <h2 className="font-display mx-auto mt-6 max-w-lg text-3xl text-white italic md:text-4xl">
        Share and license documented digital artifacts
      </h2>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/55">
        Contribute an artifact with reliable context and media, choose its
        license and price, and reach researchers, institutions, educators,
        and collectors after curatorial approval.
      </p>
      <div className="mt-8 flex justify-center">
        <Button href="/upload" variant="outline">
          Contribute an Artifact
        </Button>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import ArtifactMediaThumb from "@/components/media/ArtifactMediaThumb";
import type { CollectionView } from "@/types/catalog";
import EmptyState from "@/components/ui/EmptyState";

type Filter = "All" | "Marble" | "Bronze" | "Ceramic" | "Glass";

const filters: Filter[] = ["All", "Marble", "Bronze", "Ceramic", "Glass"];

type CollectionsGridProps = {
  items: CollectionView[];
};

export default function CollectionsGrid({ items }: CollectionsGridProps) {
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = items.filter(
    (c) => c.count > 0 && (filter === "All" || c.category === filter)
  );

  return (
    <section className="bg-cream px-10 py-14 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-2 flex max-w-full items-center gap-1 overflow-x-auto px-2 pb-1 sm:mx-0 sm:gap-2 sm:px-0">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 text-[10px] tracking-label uppercase transition-colors ${
                  filter === f
                    ? "bg-ink text-cream"
                    : "text-stone hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs text-stone">
            {filtered.length} {filtered.length === 1 ? "collection" : "collections"}
          </span>
        </div>

        {filtered.length ? <div className="mt-9 grid grid-cols-1 gap-x-7 gap-y-14 sm:grid-cols-2">
          {filtered.map((collection) => (
            <div key={collection.slug}>
              <Link
                href={`/collections/${collection.slug}`}
                className="group block"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <ArtifactMediaThumb
                    image={collection.heroImage}
                    video={collection.video}
                    model={collection.model}
                    primaryMediaType={collection.primaryMediaType}
                    alt={collection.title}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    notifyWhenUnavailable={false}
                  />
                </div>
                <h3 data-no-translate className="font-display mt-5 text-2xl italic group-hover:underline">
                  {collection.title}
                </h3>
              </Link>
              <p data-no-translate className="mt-1.5 text-xs tracking-wide text-stone uppercase">
                {collection.subtitle} · {collection.count} {collection.count === 1 ? "Model" : "Models"}
              </p>
              <p data-no-translate className="mt-3 max-w-md text-sm leading-relaxed text-charcoal/75">
                {collection.description}
              </p>
              <Link
                href={`/collections/${collection.slug}`}
                className="mt-4 inline-block border border-line px-6 py-2.5 text-[10px] tracking-label text-ink uppercase hover:bg-ink hover:text-cream"
              >
                View Collection
              </Link>
            </div>
          ))}
        </div> : (
          <div className="mt-9">
            <EmptyState title="No collections found" message="There are no collections in this category yet. Try another material." />
          </div>
        )}
      </div>
    </section>
  );
}

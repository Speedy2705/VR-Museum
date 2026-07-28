"use client";

import { useState } from "react";
import ProductCard from "@/components/marketplace/ProductCard";
import type { MarketplaceView } from "@/types/catalog";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

type Filter = "all" | "free" | "paid";
type Sort = "featured" | "price-low" | "price-high";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
];

type MarketplaceGridProps = {
  items: MarketplaceView[];
  pagination: { page: number; pages: number; total: number };
};

export default function MarketplaceGrid({ items, pagination }: MarketplaceGridProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("featured");

  const filtered = items.filter((p) => {
    if (filter === "free") return p.price === null;
    if (filter === "paid") return p.price !== null;
    return true;
  }).toSorted((a, b) => {
    if (sort === "featured") return 0;
    const first = a.price ?? 0;
    const second = b.price ?? 0;
    return sort === "price-low" ? first - second : second - first;
  });

  return (
    <section className="bg-cream px-10 py-14 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <span className="text-[10px] tracking-label text-stone uppercase">
              Filters
            </span>
            <div className="-mx-2 flex max-w-full items-center gap-1 overflow-x-auto px-2 sm:mx-0 sm:gap-2 sm:px-0">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-1.5 text-[10px] tracking-label uppercase transition-colors ${
                    filter === f.key
                      ? "bg-ink text-cream"
                      : "text-stone hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-5">
            <label htmlFor="marketplace-sort" className="sr-only">Sort marketplace results</label>
            <select
              id="marketplace-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className="border border-line bg-transparent px-3 py-2 text-[10px] tracking-label text-ink uppercase"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <span className="whitespace-nowrap text-xs text-stone">{pagination.total} results</span>
          </div>
        </div>

        {filtered.length ? <div className="mt-8 grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.listingId}
              product={product}
              imageSizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div> : (
          <div className="mt-8">
            <EmptyState title="No models match this filter" message="Try a different price filter to see more artifacts." />
          </div>
        )}
        {pagination.pages > 1 && (
          <nav aria-label="Marketplace pages" className="mt-12 flex items-center justify-center gap-4">
            {pagination.page > 1 && <Link href={`/marketplace?page=${pagination.page - 1}`} className="border border-line px-5 py-2.5 text-[10px] tracking-label uppercase">← Previous</Link>}
            <span className="text-xs text-stone">Page {pagination.page} of {pagination.pages}</span>
            {pagination.page < pagination.pages && <Link href={`/marketplace?page=${pagination.page + 1}`} className="border border-line px-5 py-2.5 text-[10px] tracking-label uppercase">Next →</Link>}
          </nav>
        )}
      </div>
    </section>
  );
}

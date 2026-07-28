import ProductCard from "@/components/marketplace/ProductCard";
import type { MarketplaceView } from "@/types/catalog";

type FeaturedListingsProps = {
  items: MarketplaceView[];
};

export default function FeaturedListings({ items }: FeaturedListingsProps) {
  return (
    <section id="featured" className="scroll-mt-24 bg-cream px-10 pt-14 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <p className="text-[11px] tracking-label text-stone uppercase">
          Featured Listings
        </p>
        <div className="mt-6 grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-3">
          {items.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              imageSizes="(min-width: 640px) 33vw, 100vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

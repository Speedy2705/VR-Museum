"use client";

import Link from "next/link";
import ArtifactMediaStage from "@/components/media/ArtifactMediaStage";
import { useCart } from "@/context/CartContext";
import type { MarketplaceView } from "@/types/catalog";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SignInPrompt from "@/components/ui/SignInPrompt";
import { useState } from "react";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { useRouter } from "next/navigation";

const cartIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="20" r="1.4" fill="currentColor" />
    <circle cx="18" cy="20" r="1.4" fill="currentColor" />
  </svg>
);

type MarketplaceItemDetailProps = {
  product: MarketplaceView;
};

export default function MarketplaceItemDetail({
  product,
}: MarketplaceItemDetailProps) {
  const { addItem, isInCart, isAuthenticated } = useCart();
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const router = useRouter();
  const inCart = isInCart(product.slug);
  const isFree = product.price === null;

  const handleAdd = () => {
    if (!isAuthenticated) {
      setSignInPromptOpen(true);
      return;
    }
    if (inCart) return;
    addItem({
      listingId: product.listingId,
      slug: product.slug,
      title: product.title,
      artist: product.artist,
      material: product.material,
      license: product.license,
      price: product.price ?? 0,
    });
  };

  const specs = [
    { label: "Material", value: product.material },
    { label: "Lighting", value: product.lighting },
    { label: "License", value: product.license },
    { label: "Period", value: product.period },
  ];

  return (
    <section className="bg-cream px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
        <ArtifactMediaStage title={product.title} image={product.image} video={product.video} model={product.model} primaryMediaType={product.primaryMediaType} />

        <div className="flex flex-col justify-center py-4">
          <Breadcrumbs items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: product.title },
          ]} />

          <p className="mt-5 text-xs tracking-wide text-stone uppercase">
            By {product.artist}
            {product.sellerRole && (
              <span className="ml-2 border border-line px-2 py-1 text-[9px] tracking-label">
                Seller
              </span>
            )}
          </p>
          <h1 className="font-display mt-1 text-3xl italic md:text-[34px]">
            {product.title}
          </h1>
          <p className="mt-2 text-xs tracking-wide text-stone uppercase">
            {product.material} · {product.period}
          </p>

          <div className="mt-6 border border-line bg-cream-dark px-5 py-4">
            <span className="text-[10px] tracking-label text-stone uppercase">
              Price
            </span>
            <p className="font-display mt-1 text-3xl italic">
              {isFree ? "Free" : `$${product.price}.00`}
            </p>
          </div>

          <div className="mt-6 divide-y divide-line border-t border-line">
            {specs.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between py-3"
              >
                <span className="text-[10px] tracking-label text-stone uppercase">
                  {s.label}
                </span>
                <span className="text-sm text-ink">{s.value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={inCart}
            className={`mt-7 flex w-full items-center justify-center gap-2 px-7 py-3.5 text-[11px] tracking-label uppercase transition-colors duration-200 ${
              inCart
                ? "border border-line bg-cream-dark text-stone"
                : "bg-ink text-cream hover:bg-charcoal"
            }`}
          >
            {inCart ? (
              "✓ In Cart"
            ) : isFree ? (
              "Get Free Model"
            ) : (
              <>
                {cartIcon} Add to Cart — ${product.price}
              </>
            )}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { handleAdd(); if (isAuthenticated) router.push("/cart"); }} className="border border-line px-5 py-3.5 text-[10px] tracking-label uppercase">Buy Now</button>
            <VrEntryModal href={`/vr/${product.slug}`} label="Enter VR" variant="dark" className="w-full px-5" />
          </div>

          {inCart && (
            <Link
              href="/cart"
              className="mt-3 text-center text-[10px] tracking-label text-stone uppercase hover:text-ink"
            >
              View Cart
            </Link>
          )}
          <SignInPrompt
            open={signInPromptOpen}
            onClose={() => setSignInPromptOpen(false)}
            title="Sign in to add to cart"
            description="Your cart is saved securely to your museum account."
            returnTo={`/marketplace/${product.slug}`}
          />
        </div>
      </div>
    </section>
  );
}

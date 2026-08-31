"use client";

import Link from "next/link";
import ArtifactMediaThumb from "@/components/media/ArtifactMediaThumb";
import Tag from "@/components/ui/Tag";
import { useCart } from "@/context/CartContext";
import type { MarketplaceView } from "@/types/catalog";
import { motion, useReducedMotion } from "motion/react";
import SignInPrompt from "@/components/ui/SignInPrompt";
import { useState } from "react";

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

type ProductCardProps = {
  product: MarketplaceView;
  imageSizes: string;
};

export default function ProductCard({ product, imageSizes }: ProductCardProps) {
  const { addItem, isInCart, isAuthenticated } = useCart();
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const inCart = isInCart(product.slug);
  const isFree = product.price === null;
  const reduceMotion = useReducedMotion();
  const href = product.href ?? `/marketplace/${product.slug}`;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
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
      image: product.image,
    });
  };

  return (
    <motion.div
      className="group"
      whileHover={reduceMotion ? undefined : { y: -4 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <ArtifactMediaThumb
            image={product.image}
            video={product.video}
            model={product.model}
            primaryMediaType={product.primaryMediaType}
            alt={product.title}
            sizes={imageSizes}
          />
          <span data-no-translate><Tag className="absolute top-3 start-3">{isFree ? "Free" : `$${product.price}`}</Tag></span>
          <span data-no-translate className="absolute end-3 bottom-3 bg-ink/70 px-2 py-1 text-xs tracking-label text-white uppercase">
            <span className="sr-only">License: </span>{product.license}
          </span>
        </div>
        <h3 data-no-translate className="motion-underline mt-3 w-fit text-sm text-ink">
          {product.title}
        </h3>
        <p data-no-translate className="mt-1 text-xs text-stone">
          {product.source === "community" ? "Uploaded by" : "by"} {product.artist} · {product.period}
          {product.sellerRole && (
            <span className="ms-2 border border-line px-1.5 py-0.5 text-xs tracking-label uppercase">
              Seller
            </span>
          )}
        </p>
      </Link>

      <button
        type="button"
        onClick={handleAdd}
        disabled={inCart}
        className={`mt-2.5 flex w-full items-center justify-center gap-1.5 border px-3 py-2.5 text-xs tracking-label uppercase transition-colors ${
          inCart
            ? "border-line bg-cream-dark text-stone"
            : "border-line text-ink hover:bg-ink hover:text-cream"
        }`}
      >
        {inCart ? (
          "✓ In Cart"
        ) : isFree ? (
          "Add Free License"
        ) : (
          <>
            {cartIcon}${product.price}
          </>
        )}
      </button>
      <SignInPrompt
        open={signInPromptOpen}
        onClose={() => setSignInPromptOpen(false)}
        title="Sign in to add to cart"
        description="Your cart is saved securely to your museum account."
        returnTo={href}
      />
    </motion.div>
  );
}

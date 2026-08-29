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
      image: product.image,
    });
  };

  const specs = [
    { label: "Material", value: product.material },
    { label: "Lighting", value: product.lighting },
    { label: "License", value: product.license },
    { label: "Period", value: product.period },
  ];

  const immersiveDetails = <div><Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: product.title }]} /><p className="mt-4 text-xs tracking-label uppercase text-stone">Marketplace artifact</p><h1 data-no-translate className="font-display mt-2 text-3xl italic">{product.title}</h1><p className="mt-2 text-xs text-stone">By {product.artist}</p><p data-no-translate className="mt-4 text-sm leading-relaxed text-charcoal/80">{product.description}</p><div className="mt-5 divide-y divide-line border-y border-line">{specs.map((spec) => <div key={spec.label} className="flex justify-between gap-4 py-2 text-xs"><span className="text-stone">{spec.label}</span><span data-no-translate>{spec.value}</span></div>)}</div></div>;
  const immersiveActions = <div><button type="button" onClick={handleAdd} disabled={inCart} className="w-full bg-ink px-5 py-3 text-xs tracking-label text-cream uppercase disabled:opacity-60">{inCart ? "In Cart" : isFree ? "Add Free License" : `Add to Cart · $${product.price}`}</button><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={() => { handleAdd(); if (isAuthenticated) router.push("/cart"); }} className="border border-white/30 px-5 py-3 text-xs tracking-label uppercase">Add & Review Cart</button><VrEntryModal href={`/vr/${product.slug}`} label="Open 3D Gallery" variant="dark" className="w-full px-5" /></div></div>;

  if (product.model) return <section className="bg-ink"><ArtifactMediaStage title={product.title} image={product.image} video={product.video} model={product.model} lighting={product.lighting} primaryMediaType="model" fullscreen overlay={immersiveDetails} overlayActions={immersiveActions} immersiveDetails plaqueOrigin={product.period} exhibitMaterial={product.material} panelDetails={{ uploadType: "Marketplace · Museum Presented", title: product.title, uploader: product.artist, description: product.description, material: product.material, origin: product.period, license: product.license, price: isFree ? "Free" : `$${product.price}` }} /><SignInPrompt open={signInPromptOpen} onClose={() => setSignInPromptOpen(false)} title="Sign in to add to cart" description="Your cart is saved securely to your museum account." returnTo={`/marketplace/${product.slug}`} /></section>;
  if (product.video && product.primaryMediaType === "video") return <section className="bg-ink"><ArtifactMediaStage title={product.title} image={product.image} video={product.video} lighting={product.lighting} primaryMediaType="video" fullscreen overlay={<>{immersiveDetails}<div className="mt-6">{immersiveActions}</div></>} /><SignInPrompt open={signInPromptOpen} onClose={() => setSignInPromptOpen(false)} title="Sign in to add to cart" description="Your cart is saved securely to your museum account." returnTo={`/marketplace/${product.slug}`} /></section>;

  return (
    <section className="bg-cream px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
        <ArtifactMediaStage title={product.title} image={product.image} video={product.video} model={product.model} lighting={product.lighting} primaryMediaType={product.primaryMediaType} />

        <div className="flex flex-col justify-center py-4">
          <Breadcrumbs items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: product.title },
          ]} />

          <p className="mt-5 text-xs tracking-wide text-stone uppercase">
            By {product.artist}
            {product.sellerRole && (
              <span className="ml-2 border border-line px-2 py-1 text-xs tracking-label">
                Seller
              </span>
            )}
          </p>
          <h1 data-no-translate className="font-display mt-1 text-3xl italic md:text-[34px]">
            {product.title}
          </h1>
          <p data-no-translate className="mt-2 text-xs tracking-wide text-stone uppercase">
            {product.material} · {product.period}
          </p>

          <div className="mt-6 border border-line bg-cream-dark px-5 py-4">
            <span className="text-xs tracking-label text-stone uppercase">
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
                <span className="text-xs tracking-label text-stone uppercase">
                  {s.label}
                </span>
                <span data-no-translate className="text-sm text-ink">{s.value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={inCart}
            className={`mt-7 flex w-full items-center justify-center gap-2 px-7 py-3.5 text-xs tracking-label uppercase transition-colors duration-200 ${
              inCart
                ? "border border-line bg-cream-dark text-stone"
                : "bg-ink text-cream hover:bg-charcoal"
            }`}
          >
            {inCart ? (
              "✓ In Cart"
            ) : isFree ? (
              "Add Free License"
            ) : (
              <>
                {cartIcon} Add to Cart — ${product.price}
              </>
            )}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { handleAdd(); if (isAuthenticated) router.push("/cart"); }} className="border border-line px-5 py-3.5 text-xs tracking-label uppercase">Add & Review Cart</button>
            <VrEntryModal href={`/vr/${product.slug}`} label="Open 3D Gallery" variant="dark" className="w-full px-5" />
          </div>

          {inCart && (
            <Link
              href="/cart"
              className="mt-3 text-center text-xs tracking-label text-stone uppercase hover:text-ink"
            >
              View Cart
            </Link>
          )}
          <p className="mt-4 text-sm leading-relaxed text-stone">The displayed license controls how you may reuse this digital artifact. Review the license notice in your cart before checkout.</p>
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

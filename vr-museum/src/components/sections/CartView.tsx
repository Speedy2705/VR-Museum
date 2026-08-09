"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { useCart } from "@/context/CartContext";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useState } from "react";

const SERVICE_FEE_RATE = 0.05;

export default function CartView() {
  const { items, removeItem, subtotal, isAuthenticated, loading } = useCart();
  const reduceMotion = useReducedMotion();
  const [removeSlug, setRemoveSlug] = useState<string | null>(null);
  const removeTarget = items.find((item) => item.slug === removeSlug);

  if (loading) {
    return (
      <section className="flex min-h-[520px] items-center justify-center bg-cream px-6">
        <p className="text-sm text-stone" role="status">Loading your cart…</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center bg-cream px-6 text-center">
        <h1 className="font-display text-3xl italic">Sign in to view your cart</h1>
        <p className="mt-3 max-w-sm text-sm text-stone">
          Cart items are stored with your museum account.
        </p>
        <Button href="/sign-in?returnTo=%2Fcart" className="mt-8">Sign In</Button>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center bg-cream px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-stone">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="20" r="1" fill="currentColor" />
            <circle cx="18" cy="20" r="1" fill="currentColor" />
          </svg>
        </span>
        <h1 className="font-display mt-6 text-3xl italic">
          Your cart is empty
        </h1>
        <p className="mt-3 max-w-xs text-sm text-stone">
          Browse the marketplace to find artifacts.
        </p>
        <Button href="/marketplace" className="mt-8">
          Go to Marketplace
        </Button>
      </section>
    );
  }

  const serviceFee = subtotal * SERVICE_FEE_RATE;
  const total = subtotal + serviceFee;

  return (
    <section className="bg-cream px-10 py-14 md:px-16">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href="/marketplace"
          className="text-[10px] tracking-label uppercase text-stone hover:text-ink"
        >
          ← Continue Shopping
        </Link>

        <div className="mt-4 flex items-baseline gap-2">
          <h1 className="font-display text-3xl italic">Your Cart</h1>
          <span className="text-xs text-stone">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
          <div className="divide-y divide-line border-t border-line">
            <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                layout={!reduceMotion}
                key={item.slug}
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: 32, height: 0, paddingTop: 0, paddingBottom: 0 }}
                className="flex gap-5 overflow-hidden py-6"
              >
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden">
                  <PlaceholderImage
                    src={item.image}
                    alt={item.title}
                    label={item.title}
                    sizes="6rem"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="text-sm text-ink">{item.title}</h3>
                  <p className="mt-1 text-xs text-stone">
                    by {item.artist}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span data-no-translate className="border border-line px-2 py-1 text-[9px] tracking-label text-stone uppercase">
                      {item.material}
                    </span>
                    <span className="border border-line px-2 py-1 text-[9px] tracking-label text-stone uppercase">
                      {item.license}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center gap-2">
                  <span className="text-sm text-ink">
                    {item.price === 0 ? "Free" : `$${item.price.toFixed(2)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRemoveSlug(item.slug)}
                    className="text-[10px] tracking-label text-stone uppercase hover:text-ink"
                  >
                    + Remove
                  </button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>

          <div>
            <div className="border border-line px-6 py-6">
              <p className="text-[10px] tracking-label text-stone uppercase">
                Order Summary
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone">
                    Subtotal ({items.length}{" "}
                    {items.length === 1 ? "item" : "items"})
                  </span>
                  <span className="text-ink">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone">Service fee (5%)</span>
                  <span className="text-ink">${serviceFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
                <span className="text-sm text-ink">Total</span>
                <span className="font-display text-2xl italic">
                  ${total.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 flex w-full items-center justify-center bg-ink px-7 py-3.5 text-[11px] tracking-label text-cream uppercase hover:bg-charcoal"
              >
                Proceed to Payment →
              </Link>
              <p className="mt-3 text-center text-[10px] text-stone">
                Secure checkout. Purchases appear in Your Assets immediately after
                payment.
              </p>
            </div>

            <div data-no-translate className="mt-4 border border-line bg-cream-dark px-5 py-4">
              <p className="text-[10px] tracking-label text-stone uppercase">
                License Notice
              </p>
              <p className="mt-2 text-xs leading-relaxed text-charcoal/70">
                Each file is licensed per the terms shown. Please review
                before use in commercial or published work.
              </p>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={removeTarget !== undefined}
        title="Remove this artifact?"
        description={`${removeTarget?.title ?? "This artifact"} will be removed from your cart.`}
        confirmLabel="Remove"
        onCancel={() => setRemoveSlug(null)}
        onConfirm={() => {
          if (removeSlug) removeItem(removeSlug);
          setRemoveSlug(null);
        }}
      />
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderSummary = {
  id: string;
  total: string;
  paymentMethod: "CARD" | "UPI";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  items: Array<{ id: string; quantity: number; listing: { artifact: { title: string } } }>;
};

export default function OrderConfirmation({ initialOrder }: { initialOrder: OrderSummary }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    if (order.paymentStatus !== "PENDING") return;
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, { cache: "no-store" });
      const body = await response.json() as { success: boolean; data?: OrderSummary };
      if (body.success && body.data) setOrder(body.data);
    }, 1500);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 30_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [order.id, order.paymentStatus]);

  const paid = order.paymentStatus === "PAID";
  return (
    <section className="flex min-h-[560px] flex-col items-center justify-center bg-cream px-6 py-16 text-center">
      <span className={`flex h-14 w-14 items-center justify-center rounded-full border ${
        paid ? "border-ink bg-ink text-cream" : "border-line text-ink"
      }`}>
        {paid ? "✓" : <span className="h-5 w-5 animate-spin rounded-full border border-current border-t-transparent" />}
      </span>
      <p className="mt-6 text-[11px] tracking-label text-stone uppercase">
        {paid ? "Payment confirmed" : "Payment submitted"}
      </p>
      <h1 className="font-display mt-4 max-w-md text-4xl italic md:text-[44px]">
        {paid ? "Thank you for your purchase" : "We’re confirming your payment"}
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-stone">
        {paid
          ? "Your order is paid and your licensed artifacts are ready in Your Assets."
          : "The provider webhook is still being verified. This page updates automatically."}
      </p>
      <div className="mt-7 w-full max-w-md border-y border-line py-5 text-left text-sm">
        <div className="flex justify-between"><span className="text-stone">Order</span><span>{order.id}</span></div>
        <div className="mt-2 flex justify-between"><span className="text-stone">Method</span><span>{order.paymentMethod === "CARD" ? "Card" : "UPI"}</span></div>
        <div className="mt-2 flex justify-between"><span className="text-stone">Items</span><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
        <div className="mt-2 flex justify-between"><span className="text-stone">Total</span><span>${Number(order.total).toFixed(2)}</span></div>
      </div>
      <div className="mt-9 flex flex-col gap-4 sm:flex-row">
        <Link href="/assets" aria-disabled={!paid}
          className={`px-7 py-3.5 text-center text-[11px] tracking-label uppercase ${
            paid ? "bg-ink text-cream hover:bg-charcoal" : "pointer-events-none bg-stone-light text-stone"
          }`}>
          View Your Assets
        </Link>
        <Link href="/marketplace" className="border border-line px-7 py-3.5 text-center text-[11px] tracking-label text-ink uppercase hover:bg-black/5">
          Keep Browsing
        </Link>
      </div>
    </section>
  );
}

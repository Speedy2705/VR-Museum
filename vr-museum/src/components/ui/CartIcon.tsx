"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export default function CartIcon() {
  const { count, isAuthenticated } = useCart();
  const reduceMotion = useReducedMotion();

  return (
    <Link
      href="/cart"
      aria-label={isAuthenticated ? "Cart" : "Sign in to view your cart"}
      className="relative text-current opacity-85 hover:opacity-100"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
      <AnimatePresence mode="popLayout">
      {count > 0 && (
        <motion.span
          key={count}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 500, damping: 24 }}
          className="absolute -top-2 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-cream text-[9px] font-medium text-ink"
        >
          {count}
        </motion.span>
      )}
      </AnimatePresence>
    </Link>
  );
}

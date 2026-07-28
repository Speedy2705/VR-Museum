"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";

const excluded = new Set(["/", "/sign-in", "/sign-up"]);

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  if (excluded.has(pathname)) return null;

  return (
    <button
      type="button"
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push("/")
      }
      className="group fixed top-24 left-4 z-20 inline-flex items-center gap-2 border border-line bg-cream/95 px-4 py-3 text-[10px] tracking-label text-ink uppercase shadow-lg backdrop-blur transition-colors hover:bg-white sm:left-6"
      aria-label="Go back"
    >
      <motion.span
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: [0, -4, 0] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 1.25, repeat: Infinity, ease: "easeInOut" }
        }
        className="inline-block text-base leading-none"
      >
        ←
      </motion.span>
      Back
    </button>
  );
}

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
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-current opacity-80 transition-opacity hover:opacity-100"
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
        className="inline-block text-xl leading-none"
      >
        ←
      </motion.span>
    </button>
  );
}

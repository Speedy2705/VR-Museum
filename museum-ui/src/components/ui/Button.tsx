"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const MotionLink = motion.create(Link);

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "filled" | "outline" | "outline-dark";
  icon?: ReactNode;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[11px] tracking-label uppercase transition-colors duration-200 whitespace-nowrap";

const variants = {
  filled: "bg-cream text-ink hover:bg-white",
  outline: "border border-line-dark text-cream hover:bg-white/5",
  "outline-dark": "border border-line text-ink hover:bg-black/5",
};

export default function Button({
  children,
  href = "#",
  variant = "filled",
  icon,
  className = "",
}: ButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionLink
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      whileHover={reduceMotion ? undefined : { scale: 1.025 }}
      whileTap={reduceMotion ? undefined : { scale: 0.975 }}
    >
      {icon}
      {children}
    </MotionLink>
  );
}

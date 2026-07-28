"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

type FadeInProps = ComponentProps<typeof motion.div> & {
  children: ReactNode;
  delay?: number;
};

export default function FadeIn({
  children,
  delay = 0,
  ...props
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={reduceMotion ? undefined : { opacity: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

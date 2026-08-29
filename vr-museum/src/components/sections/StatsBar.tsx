"use client";

import StaggerContainer, { staggerItem } from "@/components/motion/StaggerContainer";
import { motion } from "motion/react";

const stats = [
  { value: "16", label: "Supported Languages" },
  { value: "5", label: "Curated Galleries" },
  { value: "3", label: "Media Experiences" },
  { value: "5", label: "Lighting Directions" },
];

export default function StatsBar() {
  return (
    <section className="bg-cream-dark">
      <StaggerContainer className="mx-auto grid max-w-[1600px] grid-cols-2 divide-x divide-y divide-line md:grid-cols-4 md:divide-y-0">
        {stats.map((s) => (
          <motion.div key={s.label} variants={staggerItem} className="px-10 py-12">
            <p className="font-display text-4xl italic">{s.value}</p>
            <p className="mt-2 text-xs tracking-label text-stone uppercase">
              {s.label}
            </p>
          </motion.div>
        ))}
      </StaggerContainer>
    </section>
  );
}

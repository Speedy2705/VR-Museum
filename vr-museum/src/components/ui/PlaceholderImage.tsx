"use client";

import Image from "next/image";
import { useState } from "react";
import { useReducedMotion } from "motion/react";

type PlaceholderImageProps = {
  src?: string;
  alt: string;
  label?: string;
  className?: string;
  dark?: boolean;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  fit?: "cover" | "contain";
};

/**
 * Drop-in image slot. Pass a `src` path from `/public/images/` (see `@/lib/media`).
 * Without `src`, renders a labeled placeholder block so layout still holds.
 */
export default function PlaceholderImage({
  src,
  alt,
  label,
  className = "",
  dark = false,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  fit = "cover",
}: PlaceholderImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const loaded = Boolean(src && loadedSrc === src);
  const failed = Boolean(src && failedSrc === src);

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        className={`${fit === "contain" ? "object-contain" : "object-cover"} ${
          reduceMotion || loaded ? "opacity-100 blur-0" : "scale-[1.01] opacity-0 blur-sm"
        } transition-[opacity,filter,transform] duration-500 motion-reduce:transition-none ${className}`}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${
        dark
          ? "bg-gradient-to-br from-[#2a271f] via-[#1c1914] to-[#0f0d0a]"
          : "bg-gradient-to-br from-[#d9d0ba] via-[#c7bda3] to-[#b3a888]"
      } ${className}`}
    >
      <span
        className={`px-4 text-center text-[11px] tracking-label uppercase ${
          dark ? "text-white/40" : "text-black/40"
        }`}
      >
        {label ?? alt}
      </span>
    </div>
  );
}

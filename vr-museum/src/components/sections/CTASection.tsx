"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { pageImages } from "@/lib/media";
import { useRole } from "@/hooks/useRole";

type CTAButton = {
  label: string;
  href?: string;
  variant?: "filled" | "outline";
  icon?: ReactNode;
  isVrTrigger?: boolean;
};

type CTASectionProps = {
  eyebrow?: string;
  titleLines?: string[];
  image?: { src: string; alt: string; label: string };
  buttons?: CTAButton[];
};

export default function CTASection({
  eyebrow = "Step Inside",
  titleLines = ["Explore Culture", "Without Borders"],
  image = {
    src: pageImages.vrHeadset,
    alt: "Person wearing a VR headset with controllers",
    label: "VR headset photo",
  },
  buttons = [
    { label: "Enter VR Museum", isVrTrigger: true, variant: "filled" },
    { label: "Upload Artifact", href: "/upload", variant: "outline" },
  ],
}: CTASectionProps) {
  const { canUpload } = useRole();
  const visibleButtons = buttons.filter((button) => button.href !== "/upload" || canUpload);
  if (!visibleButtons.length) return null;

  return (
    <section className="relative flex h-[640px] items-center justify-center overflow-hidden">
      <PlaceholderImage
        src={image.src}
        alt={image.alt}
        label={image.label}
        sizes="100vw"
        dark
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
        <p className="text-[11px] tracking-[0.35em] text-white/45 uppercase">
          {eyebrow}
        </p>

        <h2 className="font-display mt-6 text-4xl leading-[1.2] text-white italic md:text-5xl">
          {titleLines.map((line, i) => (
            <span key={line}>
              {line}
              {i < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h2>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {visibleButtons.map((b) =>
            b.isVrTrigger ? (
              <VrEntryModal
                key={b.label}
                label={b.label}
                variant={b.variant ?? "filled"}
              />
            ) : (
              <Button
                key={b.label}
                href={b.href ?? "#"}
                variant={b.variant ?? "filled"}
                icon={b.icon}
              >
                {b.label}
              </Button>
            )
          )}
        </div>
      </div>
    </section>
  );
}

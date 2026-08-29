import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { pageImages } from "@/lib/media";

export default function CollectionsHero() {
  return (
    <section className="relative flex h-[380px] w-full items-end overflow-hidden">
      <PlaceholderImage
        src={pageImages.galleryInterior}
        priority
        alt="Museum gallery interior with sculpture on plinths"
        label="Collections hero — gallery interior"
        sizes="100vw"
        dark
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="relative z-10 w-full px-10 pb-10 md:px-16">
        <p className="text-[11px] tracking-label text-white/55 uppercase">
          The Virtual Museum
        </p>
        <h1 className="font-display mt-4 text-5xl text-white italic md:text-[52px]">
          Collections
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
          Enter galleries shaped by material, making tradition, and modes of
          presentation—from carved stone and metalwork to pottery, painting,
          and textiles.
        </p>
      </div>
    </section>
  );
}

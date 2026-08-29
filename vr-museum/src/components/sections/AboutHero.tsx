import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { pageImages } from "@/lib/media";

export default function AboutHero() {
  return (
    <section className="relative flex h-[560px] w-full items-end overflow-hidden">
      <PlaceholderImage
        src={pageImages.heroGallery}
        priority
        alt="Museum gallery interior with framed paintings"
        label="Hero — museum gallery photo"
        sizes="100vw"
        dark
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="relative z-10 w-full px-10 pb-14 md:px-16">
        <p className="text-[11px] tracking-[0.3em] text-white/45 uppercase">
          About ViswaRoop
        </p>

        <h1 className="font-display mt-5 max-w-2xl text-5xl leading-[1.15] text-white italic md:text-[56px]">
          Where Artifacts Meet Virtual Light
        </h1>

        <p className="mt-6 max-w-md text-sm leading-relaxed text-white/65">
          ViswaRoop is a platform for artists, archaeologists, and museum curators
          to share 3D scans of historical artifacts — and present them to the
          world in an immersive VR museum with physically accurate lighting.
        </p>
      </div>
    </section>
  );
}

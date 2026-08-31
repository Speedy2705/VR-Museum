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
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />

      <div className="relative z-10 w-full px-10 pb-14 md:px-16">
        <p className="text-xs tracking-[0.22em] text-white/85 uppercase">
          About ViswaRoop
        </p>

        <h1 className="font-display mt-5 max-w-2xl text-5xl leading-[1.15] text-white italic md:text-[56px]">
          A living museum without walls
        </h1>

        <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/90">
          ViswaRoop brings cultural heritage into a multilingual digital space
          where people can explore, study, contribute, curate, license, and
          collect artifacts through images, video, interactive 3D, and VR.
        </p>
      </div>
    </section>
  );
}

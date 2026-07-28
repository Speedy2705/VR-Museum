import PlaceholderImage from "@/components/ui/PlaceholderImage";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { pageImages } from "@/lib/media";

type CollectionCTABannerProps = {
  title: string;
  image?: { src?: string; alt: string; label: string };
};

export default function CollectionCTABanner({
  title,
  image = {
    src: pageImages.vrPerson,
    alt: "Person wearing a VR headset",
    label: "VR person photo",
  },
}: CollectionCTABannerProps) {
  return (
    <section className="relative flex h-[280px] items-center justify-center overflow-hidden">
      <PlaceholderImage
        src={image.src}
        alt={image.alt}
        label={image.label}
        sizes="100vw"
        dark
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex flex-col items-center gap-7 px-6 text-center">
        <h2 className="font-display text-3xl text-white italic md:text-4xl">
          {title}
        </h2>
        <VrEntryModal />
      </div>
    </section>
  );
}

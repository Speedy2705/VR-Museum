import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { pageImages } from "@/lib/media";
import BrandLogo from "@/components/ui/BrandLogo";

export default function AuthVisualPanel() {
  return (
    <div className="relative hidden md:block">
      <PlaceholderImage
        src={pageImages.galleryInterior}
        priority
        alt="Museum gallery interior with framed paintings"
        label="Museum gallery photo"
        sizes="50vw"
        dark
      />
      <div className="absolute inset-0 bg-black/40" />

      <BrandLogo variant="light" className="absolute top-6 left-8 h-auto w-36" />

      <div className="absolute bottom-14 left-8 max-w-sm">
        <h2 className="font-display text-3xl leading-[1.25] text-white italic md:text-4xl">
          History, illuminated
          <br />
          in virtual reality
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          Join artists and curators placing their artifacts in the world&apos;s
          first VR museum built around lighting science.
        </p>
      </div>
    </div>
  );
}

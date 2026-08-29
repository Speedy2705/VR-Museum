import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { pageImages } from "@/lib/media";

type PageHeroProps = {
  title: string;
  subtitle: string;
  imageSrc?: string;
  children?: React.ReactNode;
};

export default function PageHero({
  title,
  subtitle,
  imageSrc = pageImages.heroGallery,
  children,
}: PageHeroProps) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative flex h-[300px] w-full items-end overflow-hidden">
        <PlaceholderImage
          src={imageSrc}
          priority
          alt="Museum gallery interior with framed paintings"
          label="Hero — museum gallery photo"
          sizes="100vw"
          dark
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="relative z-10 w-full px-10 pb-9 md:px-16">
          <h1 className="font-display text-4xl text-white italic md:text-[44px]">
            {title}
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/60">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

import Link from "next/link";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { pageImages } from "@/lib/media";

type PageHeroProps = {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
  imageSrc?: string;
  children?: React.ReactNode;
};

export default function PageHero({
  title,
  subtitle,
  backHref = "/",
  backLabel = "← Home",
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
          <Link
            href={backHref}
            className="text-[11px] tracking-label uppercase text-white/60 hover:text-white"
          >
            {backLabel}
          </Link>
          <h1 className="font-display mt-4 text-4xl text-white italic md:text-[44px]">
            {title}
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/60">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

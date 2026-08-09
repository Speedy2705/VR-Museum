import PlaceholderImage from "@/components/ui/PlaceholderImage";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

type CollectionHeroProps = {
  title: string;
  subtitle: string;
  image: { src?: string; alt: string; label: string };
};

export default function CollectionHero({
  title,
  subtitle,
  image,
}: CollectionHeroProps) {
  return (
    <section className="relative flex h-[480px] w-full items-end overflow-hidden">
      <PlaceholderImage
        src={image.src}
        priority
        alt={image.alt}
        label={image.label}
        sizes="100vw"
        dark
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      <div className="relative z-10 w-full px-10 pb-10 md:px-16">
        <Breadcrumbs light items={[{ label: "Collections", href: "/collections" }, { label: title }]} />

        <h1 data-no-translate className="font-display mt-5 text-5xl text-white italic md:text-[52px]">
          {title}
        </h1>
        <p data-no-translate className="mt-3 text-[11px] tracking-label text-white/55 uppercase">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

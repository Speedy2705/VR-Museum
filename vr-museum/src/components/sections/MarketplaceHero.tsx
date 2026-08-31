import Button from "@/components/ui/Button";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { pageImages } from "@/lib/media";

export default function MarketplaceHero() {
  return (
    <section className="relative flex h-[440px] w-full items-end overflow-hidden">
      <PlaceholderImage
        src={pageImages.marketplaceHero}
        priority
        alt="Studio table with small artifacts laid out for scanning"
        label="Marketplace hero — studio artifact photo"
        sizes="100vw"
        dark
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />

      <div className="relative z-10 w-full px-10 pb-12 md:px-16">
        <p className="text-xs tracking-[0.18em] text-white/85 uppercase">
          Digital Artifact Marketplace
        </p>

        <h1 className="font-display mt-4 max-w-lg text-5xl leading-[1.15] text-white italic md:text-[52px]">
          Discover &amp; License
          <br />
          Digital Heritage
        </h1>

        <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/90">
          Discover curator-approved digital artifacts for personal study,
          research, education, institutional presentation, or commercial use
          where the selected license permits it.
        </p>

        <div className="mt-7 flex max-w-xl flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="Search by name, material, era, artist..."
            className="w-full border border-white/25 bg-white/10 px-5 py-3.5 text-sm text-white placeholder:text-white/45 focus:border-white/60 focus:outline-none sm:max-w-xs"
          />
          <Button href="/upload" variant="outline">
            Contribute Your Work
          </Button>
        </div>
        <a href="#license-guide" className="mt-5 inline-block text-xs tracking-label text-white/90 underline decoration-white/50 underline-offset-4 uppercase hover:text-white">
          Understand the licenses
        </a>
      </div>
    </section>
  );
}

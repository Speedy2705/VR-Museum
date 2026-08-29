import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MarketplaceHero from "@/components/sections/MarketplaceHero";
import FeaturedListings from "@/components/sections/FeaturedListings";
import MarketplaceGrid from "@/components/sections/MarketplaceGrid";
import MarketplaceCTABanner from "@/components/sections/MarketplaceCTABanner";
import { listMarketplace } from "@/server/services/marketplace.service";
import { publicUploadToMarketplaceView, toMarketplaceView } from "@/server/view-models";
import { Suspense } from "react";
import { GridSectionSkeleton } from "@/components/ui/PageSkeleton";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact, getLocalizedUpload } from "@/server/services/content-translation.service";
import { localizedMetadata } from "@/lib/localized-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return { ...await localizedMetadata("Digital Artifact Marketplace", "Discover curator-approved digital cultural artifacts with clear licensing for study, education, presentation, collecting, and permitted commercial use."), openGraph: { images: ["/images/marketplace-hero.png"] } };
}

async function MarketplaceResults({ page }: { page: number }) {
  const result = await listMarketplace({ page, limit: 12 });
  const locale = await getRequestLocale();
  const localizedItems = await Promise.all(result.items.map(async (entry) => entry.source === "museum"
    ? { ...entry, item: { ...entry.item, artifact: await getLocalizedArtifact(entry.item.artifact, locale) } }
    : { ...entry, item: await getLocalizedUpload(entry.item, locale) }));
  const marketplaceProducts = localizedItems.map((entry) =>
    entry.source === "museum"
      ? toMarketplaceView(entry.item, locale)
      : publicUploadToMarketplaceView(entry.item, locale),
  );
  const featured = marketplaceProducts.slice(0, 3);

  return (
    <>
      <FeaturedListings items={featured} />
      <MarketplaceGrid items={marketplaceProducts} pagination={result.pagination} />
    </>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  return (
    <>
      <Navbar hasHeroBackground />
      <main>
        <MarketplaceHero />
        <Suspense fallback={<GridSectionSkeleton />}>
          <MarketplaceResults page={page} />
        </Suspense>
        <MarketplaceCTABanner />
      </main>
      <Footer />
    </>
  );
}

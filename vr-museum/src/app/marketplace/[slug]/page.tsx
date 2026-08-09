import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MarketplaceItemDetail from "@/components/sections/MarketplaceItemDetail";
import {
  getMarketplaceListing,
  listMarketplace,
} from "@/server/services/marketplace.service";
import { toMarketplaceView } from "@/server/view-models";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact } from "@/server/services/content-translation.service";
import { getLocalizedUiPhrases } from "@/server/services/ui-translation.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getMarketplaceListing(slug).catch(() => null);
  const locale = await getRequestLocale();
  if (!listing) return { title: (await getLocalizedUiPhrases(locale, ["Listing not found"]))[0] };
  const [artifact, [marketplace]] = await Promise.all([
    getLocalizedArtifact(listing.artifact, locale),
    getLocalizedUiPhrases(locale, ["Marketplace"]),
  ]);
  return {
    title: `${artifact.title} — ${marketplace}`,
    description: artifact.description,
    openGraph: { images: listing.artifact.image ? [listing.artifact.image] : [] },
  };
}

export async function generateStaticParams() {
  const result = await listMarketplace({ page: 1, limit: 100 });
  return result.items
    .filter((entry) => entry.source === "museum")
    .map((entry) => ({ slug: entry.item.artifact.slug }));
}

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getMarketplaceListing(slug).catch(() => notFound());
  const locale = await getRequestLocale();
  const localizedArtifact = await getLocalizedArtifact(listing.artifact, locale);
  const product = toMarketplaceView({ ...listing, artifact: localizedArtifact }, locale);

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <MarketplaceItemDetail product={product} />
      </main>
      <Footer />
    </>
  );
}

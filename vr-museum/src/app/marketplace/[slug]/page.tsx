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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getMarketplaceListing(slug).catch(() => null);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.artifact.title} — Marketplace`,
    description: listing.artifact.description,
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
  const product = toMarketplaceView(listing);

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

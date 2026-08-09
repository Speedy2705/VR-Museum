import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CollectionsHero from "@/components/sections/CollectionsHero";
import CollectionsGrid from "@/components/sections/CollectionsGrid";
import CTASection from "@/components/sections/CTASection";
import { pageImages } from "@/lib/media";
import { listPublicCollections } from "@/server/services/collection.service";
import { Suspense } from "react";
import { GridSectionSkeleton } from "@/components/ui/PageSkeleton";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedCollection } from "@/server/services/content-translation.service";
import { mapWithConcurrency } from "@/server/concurrency";
import { localizedMetadata } from "@/lib/localized-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return { ...await localizedMetadata("Collections", "Browse virtual museum collections grouped by material, culture, and era."), openGraph: { images: ["/images/gallery-interior.png"] } };
}
export const dynamic = "force-dynamic";

async function CollectionResults() {
  const [rows, locale] = await Promise.all([listPublicCollections("en"), getRequestLocale()]);
  const collections = await mapWithConcurrency(rows, 8, async (collection) =>
    "translations" in collection ? getLocalizedCollection(collection, locale) : collection);
  return <CollectionsGrid items={collections} />;
}

export default function CollectionsPage() {
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <CollectionsHero />
        <Suspense fallback={<GridSectionSkeleton />}>
          <CollectionResults />
        </Suspense>
        <CTASection
          eyebrow="Ready?"
          titleLines={["Add your artifact to the museum"]}
          image={{
            src: pageImages.vrPerson,
            alt: "Person wearing a VR headset",
            label: "VR person photo",
          }}
          buttons={[
            {
              label: "Upload Artifact →",
              href: "/upload",
            },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}

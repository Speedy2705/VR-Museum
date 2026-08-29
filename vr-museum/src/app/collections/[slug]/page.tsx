import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CollectionHero from "@/components/sections/CollectionHero";
import CollectionInfoBar from "@/components/sections/CollectionInfoBar";
import ArtifactGrid, {
  ArtifactCardData,
} from "@/components/sections/ArtifactGrid";
import CollectionCTABanner from "@/components/sections/CollectionCTABanner";
import {
  getCollection,
  getCommunityCollection,
  listPublicCollections,
} from "@/server/services/collection.service";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact, getLocalizedCollection, getLocalizedUpload } from "@/server/services/content-translation.service";
import { translationFor } from "@/lib/localized-content";
import { mapWithConcurrency } from "@/server/concurrency";
import { getLocalizedUiPhrases } from "@/server/services/ui-translation.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  if (slug === "community-uploads") {
    const [title, description] = await getLocalizedUiPhrases(locale, [
      "Community Uploads",
      "Curator-approved 3D artifacts contributed by museum community creators.",
    ]);
    return {
      title,
      description,
    };
  }
  const collection = await getCollection(slug, "en").catch(() => null);
  if (!collection) return { title: (await getLocalizedUiPhrases(locale, ["Collection not found"]))[0] };
  const localizedCollection = await getLocalizedCollection(collection, locale);
  return {
    title: localizedCollection.title,
    description: localizedCollection.description,
    openGraph: { images: collection.heroImage ? [collection.heroImage] : [] },
  };
}

export async function generateStaticParams() {
  return (await listPublicCollections("en")).map((collection) => ({
    slug: collection.slug,
  }));
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  if (slug === "community-uploads") {
    const requested = Number((await searchParams).page ?? "1");
    const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
    const community = await getCommunityCollection(page, 12);
    const locale = await getRequestLocale();
    const localizedUploads = await mapWithConcurrency(community.artifacts, 8, (upload) => getLocalizedUpload(upload, locale));
    const items: ArtifactCardData[] = localizedUploads.map((upload) => {
      const metadata = upload.metadata && typeof upload.metadata === "object"
        ? upload.metadata as Record<string, unknown>
        : {};
      const localized = translationFor(upload.translations, locale);
      return {
        slug: upload.id,
        title: String(localized.title ?? upload.title),
        subtitle: `${String(localized.material ?? metadata.material ?? upload.category)} · ${String(localized.origin ?? metadata.origin ?? "Community contribution")}`,
        preset: "Community Upload",
        image: upload.thumbnailUrl ?? undefined,
        video: upload.mediaType === "VIDEO" ? upload.fileUrl : undefined,
        model:
          upload.mediaType === "MODEL_3D" &&
          (upload.modelFormat === "glb" ||
            upload.modelFormat === "gltf" ||
            upload.modelFormat === "usdz")
            ? { url: upload.fileUrl, format: upload.modelFormat }
            : undefined,
        primaryMediaType:
          upload.mediaType === "MODEL_3D"
            ? "model"
            : upload.mediaType.toLowerCase() as "image" | "video",
        href: `/community/${upload.id}`,
        attribution: `Uploaded by ${upload.owner.name ?? "Museum community member"}`,
      };
    });
    return (
      <>
        <Navbar hasHeroBackground={false} />
        <main>
          <CollectionHero title={community.title} subtitle={`${community.subtitle} · ${community.pagination.total} ${community.pagination.total === 1 ? "Model" : "Models"}`}
            image={{ src: community.heroImage, alt: community.title, label: community.title }} />
          <CollectionInfoBar description={community.description} />
          <ArtifactGrid items={items} collectionSlug={community.slug} count={community.pagination.total} />
          <div className="flex justify-center gap-4 bg-cream pb-16 text-xs">
            {page > 1 && <a className="border border-line px-5 py-3" href={`?page=${page - 1}`}>← Previous</a>}
            <span className="px-3 py-3">Page {page} of {Math.max(1, community.pagination.pages)}</span>
            {page < community.pagination.pages && <a className="border border-line px-5 py-3" href={`?page=${page + 1}`}>Next →</a>}
          </div>
        </main>
        <Footer />
      </>
    );
  }
  const locale = await getRequestLocale();
  const rawCollection = await getCollection(slug, "en").catch(() => notFound());
  const [localizedCollection, artifacts] = await Promise.all([
    getLocalizedCollection(rawCollection, locale),
    mapWithConcurrency(rawCollection.artifacts, 8, (artifact) => getLocalizedArtifact(artifact, locale)),
  ]);
  const collection = { ...localizedCollection, artifacts };

  const items: ArtifactCardData[] = collection.artifacts.map((a) => ({
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    preset: a.preset,
    image: a.image,
    video: a.videoUrl ?? undefined,
    model:
      a.modelUrl &&
      (a.modelFormat === "glb" ||
        a.modelFormat === "gltf" ||
        a.modelFormat === "usdz")
        ? { url: a.modelUrl, format: a.modelFormat }
        : undefined,
    primaryMediaType:
      a.primaryMediaType === "MODEL_3D"
        ? "model"
        : a.primaryMediaType.toLowerCase() as "image" | "video",
  }));

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <CollectionHero
          title={collection.title}
          subtitle={`${collection.subtitle} · ${collection.artifacts.length} ${collection.artifacts.length === 1 ? "Model" : "Models"}`}
          image={{
            src: collection.heroImage,
            alt: collection.title,
            label: `Collection hero — ${collection.title}`,
          }}
        />
        <CollectionInfoBar description={collection.description} />
        <ArtifactGrid
          items={items}
          collectionSlug={collection.slug}
          count={collection.artifacts.length}
        />
        <CollectionCTABanner title={`Explore ${collection.title} in VR`} />
      </main>
      <Footer />
    </>
  );
}

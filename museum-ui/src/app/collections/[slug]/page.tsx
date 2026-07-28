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

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "community-uploads") {
    return {
      title: "Community Uploads",
      description: "Curator-approved 3D artifacts contributed by museum community creators.",
    };
  }
  const collection = await getCollection(slug).catch(() => null);
  if (!collection) return { title: "Collection not found" };
  return {
    title: collection.title,
    description: collection.description,
    openGraph: { images: collection.heroImage ? [collection.heroImage] : [] },
  };
}

export async function generateStaticParams() {
  return (await listPublicCollections()).map((collection) => ({
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
    const items: ArtifactCardData[] = community.artifacts.map((upload) => {
      const metadata = upload.metadata && typeof upload.metadata === "object"
        ? upload.metadata as Record<string, unknown>
        : {};
      return {
        slug: upload.id,
        title: upload.title,
        subtitle: `${upload.category} · ${String(metadata.origin ?? "Community contribution")}`,
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
          <CollectionHero title={community.title} subtitle={`${community.subtitle} · ${community.pagination.total} Models`}
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
  const collection = await getCollection(slug).catch(() => notFound());

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
          subtitle={`${collection.subtitle} · ${collection.artifacts.length} Models`}
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

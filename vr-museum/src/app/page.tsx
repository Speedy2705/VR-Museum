import Footer from "@/components/layout/Footer";
import HomeHeroHeader from "@/components/sections/HomeHeroHeader";
import CategoryStrip from "@/components/sections/CategoryStrip";
import MainExperience from "@/components/sections/MainExperience";
import WelcomeSection from "@/components/sections/WelcomeSection";
import CollectionGrid from "@/components/sections/CollectionGrid";
import CTASection from "@/components/sections/CTASection";
import { listArtifacts } from "@/server/services/artifact.service";
import { listCollections } from "@/server/services/collection.service";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact, getLocalizedCollection } from "@/server/services/content-translation.service";
import { mapWithConcurrency } from "@/server/concurrency";

export default async function Home() {
  const [collectionRows, artifactRows, locale] = await Promise.all([
    listCollections("en"),
    listArtifacts({}, "en"),
    getRequestLocale(),
  ]);
  const [localizedCollections, artifacts] = await Promise.all([
    mapWithConcurrency(collectionRows, 8, (collection) => getLocalizedCollection(collection, locale)),
    mapWithConcurrency(artifactRows, 8, (artifact) => getLocalizedArtifact(artifact, locale)),
  ]);
  const collections = localizedCollections.map((collection) => ({
    ...collection,
    count: collection._count.artifacts,
    video: collection.artifacts[0]?.videoUrl ?? undefined,
    model:
      collection.artifacts[0]?.modelUrl &&
      (collection.artifacts[0].modelFormat === "glb" ||
        collection.artifacts[0].modelFormat === "gltf" ||
        collection.artifacts[0].modelFormat === "obj" ||
        collection.artifacts[0].modelFormat === "stl" ||
        collection.artifacts[0].modelFormat === "usdz")
        ? {
            url: collection.artifacts[0].modelUrl,
            format: collection.artifacts[0].modelFormat as
              | "glb"
              | "gltf"
              | "obj"
              | "stl"
              | "usdz",
          }
        : undefined,
    primaryMediaType:
      collection.artifacts[0]?.primaryMediaType === "MODEL_3D"
        ? "model" as const
        : collection.artifacts[0]?.primaryMediaType.toLowerCase() as
            | "image"
            | "video"
            | undefined,
  }));
  const categories = collections.slice(0, 3).map((collection) => ({
    title: collection.title,
    slug: collection.slug,
    items: artifacts
      .filter((artifact) => artifact.collectionId === collection.id)
      .slice(0, 3)
      .map((artifact) => ({
        name: artifact.title,
        image: artifact.image,
        href: `/collections/${collection.slug}/${artifact.slug}`,
      })),
  }));
  return (
    <>
      <HomeHeroHeader>
        <CategoryStrip categories={categories} />
        <MainExperience />
        <WelcomeSection />
        <CollectionGrid collections={collections} />
        <CTASection />
      </HomeHeroHeader>
      <Footer />
    </>
  );
}

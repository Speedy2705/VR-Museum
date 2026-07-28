import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ArtifactDetail from "@/components/sections/ArtifactDetail";
import { getArtifact, listArtifacts } from "@/server/services/artifact.service";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artifact: string }>;
}): Promise<Metadata> {
  const { artifact: slug } = await params;
  const artifact = await getArtifact(slug).catch(() => null);
  if (!artifact) return { title: "Artifact not found" };
  return {
    title: artifact.title,
    description: artifact.description,
    openGraph: { images: artifact.image ? [artifact.image] : [] },
  };
}

export async function generateStaticParams() {
  return (await listArtifacts({})).map((artifact) => ({
    slug: artifact.collection.slug,
    artifact: artifact.slug,
  }));
}

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ slug: string; artifact: string }>;
}) {
  const { slug, artifact: artifactSlug } = await params;
  const artifact = await getArtifact(artifactSlug).catch(() => notFound());
  if (artifact.collection.slug !== slug) notFound();
  const [period = "", material = "Artifact"] = artifact.subtitle.split(" · ");

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <ArtifactDetail
          title={artifact.title}
          location={artifact.subtitle}
          description={artifact.description}
          specs={[
            { label: "Material", value: material },
            { label: "Lighting", value: artifact.preset },
            { label: "Period", value: period },
          ]}
          preset={{
            name: artifact.preset,
            note: `Museum lighting preset selected for ${material.toLowerCase()} presentation.`,
          }}
          image={{
            src: artifact.image,
            alt: artifact.title,
            label: artifact.title,
          }}
          video={artifact.videoUrl ?? undefined}
          model={artifact.modelUrl && (artifact.modelFormat === "glb" || artifact.modelFormat === "gltf" || artifact.modelFormat === "usdz") ? { url: artifact.modelUrl, format: artifact.modelFormat } : undefined}
          primaryMediaType={artifact.primaryMediaType === "MODEL_3D" ? "model" : artifact.primaryMediaType.toLowerCase() as "image" | "video"}
          backHref={`/collections/${artifact.collection.slug}`}
          collectionTitle={artifact.collection.title}
          vrSlug={artifact.slug}
          sale={artifact.isForSale && artifact.listings[0] ? {
            listingId: artifact.listings[0].id,
            slug: artifact.slug,
            artist: artifact.listings[0].seller.name ?? "Museum Contributor",
            material,
            price: Number(artifact.listings[0].price),
            image: artifact.image,
          } : undefined}
        />
      </main>
      <Footer />
    </>
  );
}

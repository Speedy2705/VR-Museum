import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ArtifactMediaStage from "@/components/media/ArtifactMediaStage";
import { getArtifact, listArtifacts } from "@/server/services/artifact.service";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact, getLocalizedCollection } from "@/server/services/content-translation.service";

export async function generateStaticParams() {
  return (await listArtifacts({}, "en")).map((artifact) => ({ slug: artifact.slug }));
}

export default async function VrArtifactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const rawArtifact = await getArtifact(slug, "en").catch(() => notFound());
  const artifact = {
    ...await getLocalizedArtifact(rawArtifact, locale),
    collection: await getLocalizedCollection(rawArtifact.collection, locale),
  };
  const model = artifact.modelUrl && (artifact.modelFormat === "glb" || artifact.modelFormat === "gltf" || artifact.modelFormat === "obj" || artifact.modelFormat === "stl")
    ? { url: artifact.modelUrl, format: artifact.modelFormat } as const
    : undefined;
  const [period = "Origin unknown", material = "Artifact"] = artifact.subtitle.split(" · ");
  const mobileDetails = <div><p data-no-translate className="text-xs tracking-label uppercase text-stone">Artifact VR Gallery · {artifact.collection.title}</p><h1 data-no-translate className="font-display mt-3 text-3xl italic">{artifact.title}</h1><p data-no-translate className="mt-3 text-xs text-stone">{artifact.subtitle}</p><p data-no-translate className="mt-5 text-sm leading-relaxed text-charcoal/80">{artifact.description}</p></div>;
  return <><Navbar hasHeroBackground={false}/><main className="bg-ink"><ArtifactMediaStage title={artifact.title} image={artifact.image} video={artifact.videoUrl ?? undefined} model={model} lighting={artifact.preset} primaryMediaType={model ? "model" : artifact.primaryMediaType === "VIDEO" ? "video" : "image"} fullscreen overlay={mobileDetails} immersiveDetails={Boolean(model)} plaqueOrigin={period} exhibitCategory={artifact.collection.title} exhibitMaterial={material} panelDetails={model ? { uploadType: `VR Gallery · ${artifact.collection.title}`, title: artifact.title, uploader: "Museum Curator", description: artifact.description, material, origin: period, license: "Museum display", price: "Not for sale" } : undefined}/></main></>;
}

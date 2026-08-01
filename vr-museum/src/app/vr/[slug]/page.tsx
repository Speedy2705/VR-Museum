import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ArtifactMediaStage from "@/components/media/ArtifactMediaStage";
import { getArtifact, listArtifacts } from "@/server/services/artifact.service";

export async function generateStaticParams() {
  return (await listArtifacts({})).map((artifact) => ({ slug: artifact.slug }));
}

export default async function VrArtifactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artifact = await getArtifact(slug).catch(() => notFound());
  const model = artifact.modelUrl && (artifact.modelFormat === "glb" || artifact.modelFormat === "gltf" || artifact.modelFormat === "obj" || artifact.modelFormat === "stl")
    ? { url: artifact.modelUrl, format: artifact.modelFormat } as const
    : undefined;
  const [period = "Origin unknown", material = "Artifact"] = artifact.subtitle.split(" · ");
  const mobileDetails = <div><p className="text-[9px] tracking-label uppercase text-stone">Artifact VR Gallery · {artifact.collection.title}</p><h1 className="font-display mt-3 text-3xl italic">{artifact.title}</h1><p className="mt-3 text-xs text-stone">{artifact.subtitle}</p><p className="mt-5 text-sm leading-relaxed text-charcoal/80">{artifact.description}</p></div>;
  return <><Navbar hasHeroBackground={false}/><main className="bg-ink pt-20"><ArtifactMediaStage title={artifact.title} image={artifact.image} video={artifact.videoUrl ?? undefined} model={model} lighting={artifact.preset} primaryMediaType={model ? "model" : artifact.primaryMediaType === "VIDEO" ? "video" : "image"} fullscreen overlay={mobileDetails} immersiveDetails={Boolean(model)} plaqueOrigin={period} panelDetails={model ? { uploadType: `VR Gallery · ${artifact.collection.title}`, title: artifact.title, uploader: "Museum Curator", description: artifact.description, material, origin: period, license: "Museum display", price: "Not for sale" } : undefined}/></main></>;
}

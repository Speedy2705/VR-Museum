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
  return <><Navbar hasHeroBackground={false}/><main className="min-h-[calc(100vh-80px)] bg-ink px-6 py-12 text-white md:px-10"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.35fr_0.65fr]"><div className="border border-white/15 bg-black/30 p-3"><ArtifactMediaStage title={artifact.title} image={artifact.image} video={artifact.videoUrl ?? undefined} model={model} lighting={artifact.preset} primaryMediaType={model ? "model" : artifact.primaryMediaType === "VIDEO" ? "video" : "image"}/></div><aside className="flex flex-col justify-center"><p className="text-[10px] tracking-label uppercase text-white/45">Artifact VR Gallery · {artifact.collection.title}</p><h1 className="font-display mt-4 text-4xl italic md:text-5xl">{artifact.title}</h1><p className="mt-4 text-sm uppercase tracking-wide text-white/50">{artifact.subtitle}</p><p className="mt-7 leading-relaxed text-white/70">{artifact.description}</p><div className="mt-8 border border-white/15 p-5"><p className="text-[9px] tracking-label uppercase text-white/45">VR controls</p><p className="mt-3 text-sm leading-relaxed text-white/65">Drag to rotate, scroll or pinch to zoom, and use the viewer’s AR/VR control when supported by your headset or browser.</p></div></aside></div></main></>;
}

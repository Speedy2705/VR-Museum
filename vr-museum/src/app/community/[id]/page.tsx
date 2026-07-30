import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ArtifactMediaStage from "@/components/media/ArtifactMediaStage";
import ReportFlagButton from "@/components/community/ReportFlagButton";
import { getPublicUpload } from "@/server/services/marketplace.service";
import CommunityViewTracker from "@/components/community/CommunityViewTracker";
import ArtifactPurchaseActions from "@/components/commerce/ArtifactPurchaseActions";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { communityListingId } from "@/server/services/upload.service";

export default async function CommunityArtifactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const upload = await getPublicUpload(id).catch(() => notFound());
  const metadata = upload.metadata && typeof upload.metadata === "object" ? upload.metadata as Record<string, unknown> : {};
  const modelFormat = upload.modelFormat;
  const model: { url: string; format: "glb" | "gltf" | "obj" | "stl" } | undefined =
    upload.mediaType === "MODEL_3D" && (modelFormat === "glb" || modelFormat === "gltf" || modelFormat === "obj" || modelFormat === "stl")
      ? { url: upload.fileUrl, format: modelFormat }
      : undefined;
  const video = upload.mediaType === "VIDEO" ? upload.fileUrl : undefined;
  const price = typeof metadata.price === "number" && metadata.price > 0 ? metadata.price : null;
  const artifactSlug = String(metadata.slug ?? upload.id);
  const uploaderName = upload.owner.name ?? "Museum community member";
  const origin = String(metadata.origin ?? "Not specified");
  const description = String(metadata.description ?? "An approved community-contributed 3D artifact.");
  const details = (
    <div className="[&_a]:text-cream">
      <p className="text-[8px] tracking-label text-cream/55 uppercase">Community Upload · Curator Approved</p>
      <h1 className="font-display mt-2 text-2xl italic xl:text-3xl">{upload.title}</h1>
      <p className="mt-2 text-xs text-cream/60">Uploaded by <Link className="underline hover:text-cream" href={`/community/creator/${upload.owner.id}`}>{uploaderName}</Link></p>
      <p className="mt-3 text-xs leading-relaxed text-cream/80">{description}</p>
      <dl className="mt-4 divide-y divide-white/15 border-y border-white/15 text-xs">
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">Material</dt><dd className="text-right">{upload.category}</dd></div>
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">Origin</dt><dd className="text-right">{origin}</dd></div>
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">License</dt><dd className="text-right">{String(metadata.license ?? "Creator-specified")}</dd></div>
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">Price</dt><dd className="text-right">{price ? `$${price}` : "Not for sale"}</dd></div>
      </dl>
    </div>
  );
  const actions = (
    <div className="[&_button]:border-white/30">
      {price ? <ArtifactPurchaseActions listingId={communityListingId(upload.id)} slug={artifactSlug} title={upload.title} artist={upload.owner.name ?? "Museum community member"} material={upload.category} price={price} image={upload.thumbnailUrl ?? undefined} /> : <VrEntryModal href={`/vr/${artifactSlug}`} label="Enter VR" variant="dark" className="w-full" />}
      <div className="mt-3 flex items-center justify-between gap-4"><Link className="text-[9px] tracking-label text-cream/60 underline uppercase hover:text-cream" href={`/community/creator/${upload.owner.id}`}>Curator profile</Link><ReportFlagButton uploadId={upload.id} /></div>
    </div>
  );

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <CommunityViewTracker uploadId={id} />
      <main className="bg-cream pt-20">
        <ArtifactMediaStage title={upload.title} image={upload.thumbnailUrl ?? undefined} video={video} model={model} lighting={upload.lightingPreset} primaryMediaType={model ? "model" : video ? "video" : "image"} fullscreen overlay={details} overlayActions={actions} immersiveDetails={Boolean(model)} plaqueOrigin={origin} panelDetails={{ uploadType: "Community Upload · Curator Approved", title: upload.title, uploader: uploaderName, description, material: upload.category, origin, license: String(metadata.license ?? "Creator-specified"), price: price ? `$${price}` : "Not for sale" }} />
      </main>
      <Footer />
    </>
  );
}

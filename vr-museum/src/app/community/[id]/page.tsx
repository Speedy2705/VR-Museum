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

export default async function CommunityArtifactPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const upload = await getPublicUpload(id).catch(() => notFound());
  const metadata = upload.metadata && typeof upload.metadata === "object"
    ? upload.metadata as Record<string, unknown>
    : {};
  const modelFormat = upload.modelFormat;
  const model: { url: string; format: "glb" | "gltf" | "obj" | "stl" } | undefined =
    upload.mediaType === "MODEL_3D" &&
    (modelFormat === "glb" || modelFormat === "gltf" || modelFormat === "obj" || modelFormat === "stl")
    ? { url: upload.fileUrl, format: modelFormat }
    : undefined;
  const video = upload.mediaType === "VIDEO" ? upload.fileUrl : undefined;
  const price = typeof metadata.price === "number" && metadata.price > 0 ? metadata.price : null;
  const artifactSlug = String(metadata.slug ?? upload.id);

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <CommunityViewTracker uploadId={id} />
      <main className="bg-cream px-6 py-16 md:px-10">
        <article className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          <ArtifactMediaStage
            title={upload.title}
            image={upload.thumbnailUrl ?? undefined}
            video={video}
            model={model}
            lighting={upload.lightingPreset}
            primaryMediaType={model ? "model" : video ? "video" : "image"}
          />
          <div className="flex flex-col justify-center">
            <p className="text-[10px] tracking-label text-stone uppercase">Community Upload · Curator Approved</p>
            <h1 className="font-display mt-3 text-4xl italic">{upload.title}</h1>
            <p className="mt-3 text-sm text-stone">
              Uploaded by <Link className="underline hover:text-ink" href={`/community/creator/${upload.owner.id}`}>{upload.owner.name ?? "Museum community member"}</Link>
            </p>
            <p className="mt-6 leading-relaxed text-charcoal">
              {String(metadata.description ?? "An approved community-contributed 3D artifact.")}
            </p>
            <dl className="mt-7 divide-y divide-line border-y border-line text-sm">
              <div className="flex justify-between py-3"><dt className="text-stone">Material</dt><dd>{upload.category}</dd></div>
              <div className="flex justify-between py-3"><dt className="text-stone">Origin</dt><dd>{String(metadata.origin ?? "Not specified")}</dd></div>
              <div className="flex justify-between py-3"><dt className="text-stone">License</dt><dd>{String(metadata.license ?? "Creator-specified")}</dd></div>
            </dl>
            {price ? <ArtifactPurchaseActions listingId={communityListingId(upload.id)} slug={artifactSlug} title={upload.title} artist={upload.owner.name ?? "Museum community member"} material={upload.category} price={price} image={upload.thumbnailUrl ?? undefined} /> : <VrEntryModal href={`/vr/${artifactSlug}`} label="Enter VR" variant="dark" className="mt-7 w-full" />}
            <div className="mt-7"><ReportFlagButton uploadId={upload.id} /></div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

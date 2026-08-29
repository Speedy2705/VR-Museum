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
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedUpload } from "@/server/services/content-translation.service";
import { translationFor } from "@/lib/localized-content";

export default async function CommunityArtifactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rawUpload, locale] = await Promise.all([getPublicUpload(id).catch(() => notFound()), getRequestLocale()]);
  const upload = await getLocalizedUpload(rawUpload, locale);
  const metadata = upload.metadata && typeof upload.metadata === "object" ? upload.metadata as Record<string, unknown> : {};
  const localized = translationFor(upload.translations, locale);
  const modelFormat = upload.modelFormat;
  const model: { url: string; format: "glb" | "gltf" | "obj" | "stl" } | undefined =
    upload.mediaType === "MODEL_3D" && (modelFormat === "glb" || modelFormat === "gltf" || modelFormat === "obj" || modelFormat === "stl")
      ? { url: upload.fileUrl, format: modelFormat }
      : undefined;
  const video = upload.mediaType === "VIDEO" ? upload.fileUrl : undefined;
  const price = typeof metadata.price === "number" && metadata.price > 0 ? metadata.price : null;
  const artifactSlug = String(metadata.slug ?? upload.id);
  const uploaderName = upload.owner.name ?? "Museum community member";
  const origin = String(localized.origin ?? metadata.origin ?? "Not specified");
  const material = String(localized.material ?? metadata.material ?? upload.category);
  const description = String(localized.description ?? metadata.description ?? "An approved community-contributed 3D artifact.");
  const localizedTitle = String(localized.title ?? upload.title);
  const details = (
    <div className="[&_a]:text-cream">
      <p className="text-xs tracking-label text-cream/55 uppercase">Community Upload · Curator Approved</p>
      <h1 className="font-display mt-2 text-2xl italic xl:text-3xl">{localizedTitle}</h1>
      <p className="mt-2 text-xs text-cream/60">Uploaded by <Link className="underline hover:text-cream" href={`/community/creator/${upload.owner.id}`}>{uploaderName}</Link></p>
      <p className="mt-3 text-xs leading-relaxed text-cream/80">{description}</p>
      <dl className="mt-4 divide-y divide-white/15 border-y border-white/15 text-xs">
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">Material</dt><dd className="text-right">{material}</dd></div>
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">Origin</dt><dd className="text-right">{origin}</dd></div>
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">License</dt><dd className="text-right">{String(metadata.license ?? "Creator-specified")}</dd></div>
        <div className="flex justify-between gap-4 py-2"><dt className="text-cream/55">Price</dt><dd className="text-right">{price ? `$${price}` : "Not for sale"}</dd></div>
      </dl>
    </div>
  );
  const actions = (
    <div className="[&_button]:border-white/30">
      {price ? <ArtifactPurchaseActions listingId={communityListingId(upload.id)} slug={artifactSlug} title={localizedTitle} artist={upload.owner.name ?? "Museum community member"} material={material} price={price} image={upload.thumbnailUrl ?? undefined} /> : <VrEntryModal href={`/vr/${artifactSlug}`} label="Enter VR" variant="dark" className="w-full" />}
      <div className="mt-3 text-right"><ReportFlagButton uploadId={upload.id} /></div>
    </div>
  );

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <CommunityViewTracker uploadId={id} />
      <main className="bg-cream">
        <ArtifactMediaStage title={localizedTitle} image={upload.thumbnailUrl ?? undefined} video={video} model={model} lighting={upload.lightingPreset} primaryMediaType={model ? "model" : video ? "video" : "image"} fullscreen overlay={details} overlayActions={actions} immersiveDetails={Boolean(model)} plaqueOrigin={origin} exhibitCategory={upload.category} exhibitMaterial={material} panelDetails={{ uploadType: "Community Upload · Curator Approved", title: localizedTitle, uploader: uploaderName, description, material, origin, license: String(metadata.license ?? "Creator-specified"), price: price ? `$${price}` : "Not for sale" }} />
      </main>
      <Footer />
    </>
  );
}

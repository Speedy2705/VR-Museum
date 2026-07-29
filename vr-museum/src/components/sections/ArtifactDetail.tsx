import ArtifactMediaStage from "@/components/media/ArtifactMediaStage";
import VrEntryModal from "@/components/ui/VrEntryModal";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ArtifactPurchaseActions from "@/components/commerce/ArtifactPurchaseActions";
import ReportFlagButton from "@/components/community/ReportFlagButton";

type Spec = { label: string; value: string };

type ArtifactDetailProps = {
  title: string;
  location: string;
  description: string;
  specs: Spec[];
  preset: { name: string; note: string };
  image?: { src?: string; alt: string; label: string };
  video?: string;
  model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" };
  primaryMediaType?: "image" | "video" | "model";
  backHref: string;
  collectionTitle: string;
  vrSlug: string;
  sale?: { listingId: string; slug: string; artist: string; material: string; price: number; image?: string };
};

export default function ArtifactDetail({
  title,
  location,
  description,
  specs,
  preset,
  image,
  video,
  model,
  primaryMediaType,
  backHref,
  collectionTitle,
  vrSlug,
  sale,
}: ArtifactDetailProps) {
  const details = (
    <div>
      <Breadcrumbs items={[{ label: "Collections", href: "/collections" }, { label: collectionTitle, href: backHref }, { label: title }]} />
      <h1 className="font-display mt-5 text-3xl italic md:text-[34px]">{title}</h1>
      <p className="mt-2 text-xs tracking-wide text-stone uppercase">{location}</p>
      <p className="mt-6 text-sm leading-relaxed text-charcoal/80">{description}</p>
      <div className="mt-6 divide-y divide-line border-t border-line">{specs.map((spec) => <div key={spec.label} className="flex items-center justify-between py-3"><span className="text-[10px] tracking-label text-stone uppercase">{spec.label}</span><span className="text-sm text-ink">{spec.value}</span></div>)}</div>
      <div className="mt-5 border border-line px-4 py-3"><p className="text-[10px] tracking-label text-stone uppercase">{preset.name}</p><p className="mt-2 text-xs leading-relaxed text-stone">{preset.note}</p></div>
      {sale ? <ArtifactPurchaseActions {...sale} title={title} /> : <VrEntryModal href={`/vr/${vrSlug}`} label="Enter VR" variant="dark" className="mt-7 w-full" />}
      <div className="mt-5 text-center"><ReportFlagButton artifactSlug={vrSlug} /></div>
    </div>
  );
  return (
    <div className="pt-20"><ArtifactMediaStage title={title} image={image?.src} video={video} model={model} lighting={preset.name} primaryMediaType={primaryMediaType} fullscreen overlay={details} /></div>
  );
}

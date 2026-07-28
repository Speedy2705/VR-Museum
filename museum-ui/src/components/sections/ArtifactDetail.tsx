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
  model?: { url: string; format: "glb" | "gltf" | "usdz" };
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
  return (
    <section className="bg-cream px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
        <ArtifactMediaStage title={title} image={image?.src} video={video} model={model} primaryMediaType={primaryMediaType} />

        <div className="flex flex-col justify-center py-4">
          <Breadcrumbs items={[
            { label: "Collections", href: "/collections" },
            { label: collectionTitle, href: backHref },
            { label: title },
          ]} />

          <h1 className="font-display mt-5 text-3xl italic md:text-[34px]">
            {title}
          </h1>
          <p className="mt-2 text-xs tracking-wide text-stone uppercase">
            {location}
          </p>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-charcoal/80">
            {description}
          </p>

          <div className="mt-8 divide-y divide-line border-t border-line">
            {specs.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between py-3"
              >
                <span className="text-[10px] tracking-label text-stone uppercase">
                  {s.label}
                </span>
                <span className="text-sm text-ink">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 border border-line px-5 py-4">
            <p className="flex items-center gap-1.5 text-[10px] tracking-label text-stone uppercase">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.3" />
              </svg>
              {preset.name}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-stone">
              {preset.note}
            </p>
          </div>

          {sale ? <ArtifactPurchaseActions {...sale} title={title} /> : <VrEntryModal href={`/vr/${vrSlug}`} label="Enter VR" variant="dark" className="mt-7 w-full" />}
          <div className="mt-5 text-center"><ReportFlagButton artifactSlug={vrSlug} /></div>
        </div>
      </div>
    </section>
  );
}

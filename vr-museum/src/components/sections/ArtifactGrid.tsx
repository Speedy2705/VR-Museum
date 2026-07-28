import Link from "next/link";
import ArtifactMediaThumb from "@/components/media/ArtifactMediaThumb";
import Tag from "@/components/ui/Tag";
import MotionCard from "@/components/motion/MotionCard";

export type ArtifactCardData = {
  slug: string;
  title: string;
  subtitle: string;
  preset: string;
  image?: string;
  video?: string;
  model?: { url: string; format: "glb" | "gltf" | "obj" | "stl" | "usdz" };
  primaryMediaType?: "image" | "video" | "model";
  href?: string;
  attribution?: string;
};

type ArtifactGridProps = {
  items: ArtifactCardData[];
  collectionSlug: string;
  count?: number;
};

export default function ArtifactGrid({
  items,
  collectionSlug,
  count,
}: ArtifactGridProps) {
  return (
    <section className="bg-cream px-5 py-14 sm:px-10 sm:py-16 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-baseline gap-2 border-b border-line pb-5">
          <h2 className="font-display text-2xl italic">Artifacts</h2>
          <span className="text-xs text-stone">
            ({count ?? items.length})
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <MotionCard key={item.slug} className="group">
            <Link
              href={item.href ?? `/collections/${collectionSlug}/${item.slug}`}
              className="block"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <ArtifactMediaThumb
                  image={item.image}
                  video={item.video}
                  model={item.model}
                  primaryMediaType={item.primaryMediaType}
                  alt={item.title}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
                <Tag className="absolute top-3 left-3">{item.preset}</Tag>
              </div>
              <h3 className="motion-underline mt-3 w-fit text-sm text-ink">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-stone">{item.subtitle}</p>
              {item.attribution && <p className="mt-1 text-xs text-stone">{item.attribution}</p>}
            </Link>
            </MotionCard>
          ))}
        </div>
      </div>
    </section>
  );
}

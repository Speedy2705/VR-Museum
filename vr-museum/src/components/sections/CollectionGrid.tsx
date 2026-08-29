import Button from "@/components/ui/Button";
import ArtifactMediaThumb from "@/components/media/ArtifactMediaThumb";
import type { CollectionView } from "@/types/catalog";

const filters = ["All", "Marble", "Bronze", "Ceramic", "Glass"];

export default function CollectionGrid({
  collections,
}: {
  collections: CollectionView[];
}) {
  const visibleCollections = collections.filter((collection) => collection.count > 0);
  const totalArtifacts = visibleCollections.reduce((sum, c) => sum + c.count, 0);
  return (
    <section className="bg-cream px-10 py-24">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-6 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-4xl italic">Collection</h2>
            <span className="text-xs text-stone">{totalArtifacts} artifacts</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((f, i) => (
              <Button
                key={f}
                href={i === 0 ? "/collections" : `/collections?material=${encodeURIComponent(f)}`}
                variant="outline-dark"
                className={`px-4 py-2 text-xs tracking-label uppercase transition-colors ${
                  i === 0
                    ? "bg-ink text-white"
                    : "border border-line text-stone hover:border-ink hover:text-ink"
                }`}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCollections.map((item) => (
            <div key={item.slug}>
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <ArtifactMediaThumb
                  image={item.heroImage}
                  video={item.video}
                  model={item.model}
                  primaryMediaType={item.primaryMediaType}
                  alt={item.title}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  notifyWhenUnavailable={false}
                />
              </div>
              <h3 data-no-translate className="font-display mt-4 text-xl italic">
                {item.title}
              </h3>
              <p data-no-translate className="mt-1 text-xs text-stone">
                {item.subtitle.split(" · ")[0]} · {item.count} {item.count === 1 ? "model" : "models"}
              </p>
              <Button
                href={`/collections/${item.slug}`}
                variant="outline-dark"
                className="mt-4 px-5 py-2.5"
              >
                View Collection
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Button href="/collections" variant="outline-dark">
            Discover More
          </Button>
        </div>
      </div>
    </section>
  );
}

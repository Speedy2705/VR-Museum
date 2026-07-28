import Link from "next/link";

import PlaceholderImage from "@/components/ui/PlaceholderImage";

type Category = {
  title: string;
  slug: string;
  items: { name: string; image?: string; href: string }[];
};

export default function CategoryStrip({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <section className="bg-cream px-5 py-14 sm:px-10 sm:py-16">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-3">
        {categories.map((category) => (
          <div key={category.slug}>
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <h3 className="font-display text-2xl italic">{category.title}</h3>
              <Link
                href={`/collections/${category.slug}`}
                className="text-[10px] tracking-label whitespace-nowrap uppercase text-stone hover:text-ink"
              >
                All →
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              {category.items.map((item) => (
                <Link key={item.href} href={item.href} className="group">
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <PlaceholderImage
                      src={item.image}
                      alt={item.name}
                      label={item.name}
                      sizes="(min-width: 768px) 11vw, 33vw"
                    />
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-stone">
                    {item.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

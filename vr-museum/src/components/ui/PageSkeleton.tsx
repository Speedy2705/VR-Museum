import LogoLoader from "@/components/ui/LogoLoader";

export default function PageSkeleton({
  variant = "grid",
}: {
  variant?: "grid" | "form";
}) {
  return (
    <main
      className="min-h-[70vh] bg-cream px-10 py-14 md:px-16"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="mx-auto max-w-[1600px]">
        <LogoLoader label="Loading page" className="mb-10 flex w-full text-stone" />
        <div className="animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-28 bg-stone/15" />
        <div className="mt-5 h-10 w-64 max-w-full bg-stone/15" />
        <div className="mt-4 h-4 w-96 max-w-full bg-stone/10" />
        {variant === "grid" ? (
          <div className="mt-12 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index}>
                <div className="aspect-[3/4] bg-stone/15" />
                <div className="mt-4 h-4 w-3/4 bg-stone/15" />
                <div className="mt-2 h-3 w-1/2 bg-stone/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-10 border-b border-stone/15" />
              ))}
            </div>
            <div className="h-72 border border-stone/15 bg-stone/5" />
          </div>
        )}
        </div>
      </div>
    </main>
  );
}

export function GridSectionSkeleton() {
  return (
    <section className="bg-cream px-10 py-16 md:px-16" aria-busy="true">
      <LogoLoader label="Loading collection" className="mb-10 flex w-full text-stone" />
      <div className="mx-auto grid max-w-[1600px] animate-pulse grid-cols-1 gap-7 motion-reduce:animate-none sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <div className="aspect-[3/4] bg-stone/15" />
            <div className="mt-4 h-4 w-3/4 bg-stone/15" />
            <div className="mt-2 h-3 w-1/2 bg-stone/10" />
          </div>
        ))}
      </div>
    </section>
  );
}

import LogoLoader from "@/components/ui/LogoLoader";

export default function PageSkeleton({
  variant = "grid",
}: {
  variant?: "grid" | "form";
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-cream px-6" aria-busy="true" aria-label="Loading page">
      <LogoLoader label={variant === "form" ? "Loading form" : "Loading page"} size="lg" />
    </main>
  );
}

export function GridSectionSkeleton() {
  return (
    <section className="flex min-h-80 items-center justify-center bg-cream px-6" aria-busy="true">
      <LogoLoader label="Loading collection" size="lg" />
    </section>
  );
}

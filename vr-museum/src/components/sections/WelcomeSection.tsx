import Link from "next/link";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { pageImages } from "@/lib/media";

export default function WelcomeSection() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-center bg-cream px-10 py-20 md:px-16 md:py-24">
        <p className="text-[11px] tracking-[0.3em] text-stone uppercase">
          Welcome
        </p>

        <h2 className="font-display mt-6 max-w-md text-4xl leading-[1.2] italic md:text-[42px]">
          Welcome to the Virtual Museum of Artifacts
        </h2>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-charcoal/80">
          NAME is built for artists, archaeologists, and museum curators who
          want their objects seen. Upload a 3D scan or model — we place it in
          a museum environment with studio-grade lighting, curate it alongside
          the broader collection, and open it to the world in VR.
        </p>

        <Link
          href="/about"
          className="mt-8 text-[11px] tracking-label uppercase text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Read More →
        </Link>
      </div>

      <div className="relative h-[520px] md:h-auto">
        <PlaceholderImage
          src={pageImages.galleryVisitor}
          alt="Visitor looking at framed paintings in a gallery"
          label="Gallery visitor photo"
          sizes="(min-width: 768px) 50vw, 100vw"
          dark
        />
      </div>
    </section>
  );
}

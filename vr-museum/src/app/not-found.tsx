import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BrandLogo from "@/components/ui/BrandLogo";

export default function NotFound() {
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="flex min-h-[65vh] items-center justify-center bg-cream px-6 text-center">
        <div>
          <BrandLogo markOnly className="mx-auto mb-6 h-auto w-24 opacity-70" />
          <p className="font-display text-7xl text-stone-light italic">404</p>
          <p className="mt-5 text-[10px] tracking-label text-stone uppercase">
            Object not on display
          </p>
          <h1 className="font-display mt-4 text-4xl italic">
            This room could not be found
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-stone">
            The exhibit may have moved, or the address may be incomplete.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex bg-ink px-7 py-3.5 text-[11px] tracking-label text-cream uppercase"
          >
            Return to the museum
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

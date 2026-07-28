import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function TermsPage() {
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="min-h-[60vh] bg-cream px-6 py-20 text-ink md:px-10">
        <article className="mx-auto max-w-3xl">
          <p className="text-[11px] tracking-label uppercase text-stone">Legal</p>
          <h1 className="font-display mt-4 text-5xl">Terms of Use</h1>
          <p className="mt-8 leading-8 text-stone">
            By using NAME, you agree to provide accurate account and listing information, respect
            artifact rights and provenance, and use purchased digital assets only under their
            stated license. Museum access may be limited to protect users and collections.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

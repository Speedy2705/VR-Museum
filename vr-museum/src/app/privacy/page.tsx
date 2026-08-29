import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function PrivacyPage() {
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="min-h-[60vh] bg-cream px-6 py-20 text-ink md:px-10">
        <article className="mx-auto max-w-3xl">
          <p className="text-xs tracking-label uppercase text-stone">Legal</p>
          <h1 className="font-display mt-4 text-5xl">Privacy Policy</h1>
          <p className="mt-8 leading-8 text-stone">
            We collect only the account, order, and artifact information needed to operate the
            museum. We do not sell personal information. Contact the museum team to request access,
            correction, or deletion of your account data.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

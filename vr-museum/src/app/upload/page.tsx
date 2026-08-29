import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/sections/PageHero";
import UploadWizard from "@/components/sections/UploadWizard";
import { pageImages } from "@/lib/media";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/role-policy";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/localized-metadata";

export function generateMetadata(): Promise<Metadata> { return localizedMetadata("Contribute an Artifact", "Submit documented cultural media for curatorial review, immersive presentation, and optional licensed distribution."); }

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <Navbar hasHeroBackground={false} />
        <main>
          <PageHero
            title="Contribute an Artifact"
            subtitle="Share documented cultural media for curatorial review and immersive presentation"
            imageSrc={pageImages.studioBackground}
          />
          <section className="flex min-h-[420px] flex-col items-center justify-center bg-cream px-6 text-center">
            <h1 className="font-display text-3xl italic">Sign in to contribute</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone">
              Sign in first, then we’ll confirm that your contributor role can submit cultural artifacts for review.
            </p>
            <Link
              href="/sign-in?returnTo=%2Fupload"
              className="mt-8 bg-ink px-7 py-3.5 text-xs tracking-label text-cream uppercase hover:bg-charcoal"
            >
              Sign In
            </Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }
  if (!hasPermission(user.role, "upload")) redirect("/access-denied?reason=upload");
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <PageHero
          title="Contribute an Artifact"
          subtitle="Add its media, cultural context, presentation, license, and listing details"
          imageSrc={pageImages.studioBackground}
        />
        <UploadWizard />
      </main>
      <Footer />
    </>
  );
}

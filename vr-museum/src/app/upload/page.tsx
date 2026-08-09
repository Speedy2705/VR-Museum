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

export function generateMetadata(): Promise<Metadata> { return localizedMetadata("Upload Artifact", "Contribute a 3D model or scan to the virtual museum."); }

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <Navbar hasHeroBackground={false} />
        <main>
          <PageHero
            title="Upload Artifact"
            subtitle="Contribute your 3D model or scan to the virtual museum"
            imageSrc={pageImages.studioBackground}
          />
          <section className="flex min-h-[420px] flex-col items-center justify-center bg-cream px-6 text-center">
            <h1 className="font-display text-3xl italic">Sign in to upload</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone">
              Sign in first, then we’ll confirm that your account role can contribute artifacts.
            </p>
            <Link
              href="/sign-in?returnTo=%2Fupload"
              className="mt-8 bg-ink px-7 py-3.5 text-[11px] tracking-label text-cream uppercase hover:bg-charcoal"
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
          title="Upload Artifact"
          subtitle="Contribute your 3D model or scan to the virtual museum"
          imageSrc={pageImages.studioBackground}
        />
        <UploadWizard />
      </main>
      <Footer />
    </>
  );
}

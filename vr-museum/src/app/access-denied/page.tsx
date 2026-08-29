import Link from "next/link";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import RoleRestrictionToast from "@/components/ui/RoleRestrictionToast";

export default function AccessDeniedPage() {
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <RoleRestrictionToast />
      <main className="grid min-h-[60vh] place-items-center bg-cream px-6 py-20 text-center text-ink">
        <div className="max-w-xl">
          <p className="text-xs tracking-label uppercase text-stone">Role-restricted area</p>
          <h1 className="font-display mt-4 text-4xl italic">Your role does not include this permission</h1>
          <p className="mt-5 text-sm leading-7 text-stone">
            Uploading and selling are available to Artists, Archaeologists, and Curators.
            Upload moderation is available only to Curators.
          </p>
          <Link href="/marketplace" className="mt-8 inline-block bg-ink px-6 py-3 text-xs tracking-label uppercase text-white">
            Return to Marketplace
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

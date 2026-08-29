import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/sections/PageHero";
import AssetsStatsBar from "@/components/sections/AssetsStatsBar";
import AssetsTabs from "@/components/sections/AssetsTabs";
import { pageImages } from "@/lib/media";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listOrders } from "@/server/services/order.service";
import { listUploads } from "@/server/services/upload.service";
import {
  ordersToPurchasedAssets,
  toUploadedAssetView,
} from "@/server/view-models";
import type { Metadata } from "next";
import BillingProfileForm from "@/components/account/BillingProfileForm";
import { getBillingProfile } from "@/server/services/user.service";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact } from "@/server/services/content-translation.service";
import { mapWithConcurrency } from "@/server/concurrency";
import { localizedMetadata } from "@/lib/localized-metadata";

export function generateMetadata(): Promise<Metadata> { return localizedMetadata("Your Assets", "Manage purchased and uploaded museum assets."); }

export default async function AssetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?returnTo=%2Fassets");
  const [orders, uploads, billingProfile, locale] = await Promise.all([
    listOrders(user.id),
    listUploads(user.id),
    getBillingProfile(user.id),
    getRequestLocale(),
  ]);
  const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
  const paidItems = paidOrders.flatMap((order) => order.items);
  const localizedArtifacts = await mapWithConcurrency(paidItems, 8, (item) =>
    getLocalizedArtifact(item.listing.artifact, locale));
  let localizedIndex = 0;
  const localizedOrders = paidOrders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      listing: { ...item.listing, artifact: localizedArtifacts[localizedIndex++] },
    })),
  }));
  const purchasedAssets = ordersToPurchasedAssets(localizedOrders, locale);
  const uploadedAssets = uploads.map((upload) => toUploadedAssetView(upload, locale));
  const totalEarnings = uploadedAssets.reduce(
    (sum, upload) => sum + (upload.earnings ?? 0),
    0,
  );
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <PageHero
          title="Your Assets"
          subtitle="Licensed acquisitions and your contributed artifacts"
          imageSrc={pageImages.galleryWall}
        >
          <AssetsStatsBar
            totalEarnings={totalEarnings}
            itemsSold={purchasedAssets.length}
            activeListings={
              uploadedAssets.filter((upload) => upload.status === "live").length
            }
          />
        </PageHero>
        <section className="border-b border-line bg-cream px-10 py-10 md:px-16">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-[10px] tracking-label uppercase text-stone">Account</p>
              <h2 className="font-display mt-2 text-2xl italic">
                {user.name ?? "Museum member"}
              </h2>
              <p className="mt-2 text-sm text-stone">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-label uppercase text-stone">Order history</p>
              {orders.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div><p className="font-display text-2xl">{orders.length}</p><p className="text-xs text-stone">Orders</p></div>
                  <div><p className="font-display text-2xl">{purchasedAssets.length}</p><p className="text-xs text-stone">Purchased items</p></div>
                  <div>
                    <p className="font-display text-2xl">
                      ${paidOrders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-stone">Lifetime purchases</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone">
                  No orders yet. Your completed purchases will appear here.
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="border-b border-line bg-cream px-10 py-10 md:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-[10px] tracking-label uppercase text-stone">Saved checkout profile</p>
            <h2 className="font-display mt-2 text-2xl italic">Billing and contact details</h2>
            <p className="mt-2 max-w-2xl text-sm text-stone">
              Save these once to autofill future checkouts. You can still edit every field before paying.
            </p>
            <BillingProfileForm initialProfile={{
              name: billingProfile.name ?? "",
              email: billingProfile.email ?? "",
              phone: billingProfile.phone ?? "",
              addressLine1: billingProfile.addressLine1 ?? "",
              addressLine2: billingProfile.addressLine2 ?? "",
              city: billingProfile.city ?? "",
              state: billingProfile.state ?? "",
              postalCode: billingProfile.postalCode ?? "",
              country: billingProfile.country ?? "",
            }} />
          </div>
        </section>
        <AssetsTabs purchased={purchasedAssets} uploaded={uploadedAssets} />
      </main>
      <Footer />
    </>
  );
}

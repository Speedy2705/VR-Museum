import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CheckoutForm from "@/components/sections/CheckoutForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getBillingProfile } from "@/server/services/user.service";

export const metadata: Metadata = { title: "Secure Checkout", description: "Complete your digital artifact purchase securely." };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?returnTo=%2Fcheckout");
  const profile = await getBillingProfile(user.id);
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <CheckoutForm initialProfile={{
          name: profile.name ?? "",
          email: profile.email,
          phone: profile.phone ?? "",
          addressLine1: profile.addressLine1 ?? "",
          addressLine2: profile.addressLine2 ?? "",
          city: profile.city ?? "",
          state: profile.state ?? "",
          postalCode: profile.postalCode ?? "",
          country: profile.country ?? "",
        }} />
      </main>
      <Footer />
    </>
  );
}

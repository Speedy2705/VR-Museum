import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartView from "@/components/sections/CartView";
import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/localized-metadata";

export function generateMetadata(): Promise<Metadata> { return localizedMetadata("Your Cart", "Review digital artifacts in your cart."); }

export default async function CartPage() {
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <CartView />
      </main>
      <Footer />
    </>
  );
}

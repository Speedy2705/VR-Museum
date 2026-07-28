import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartView from "@/components/sections/CartView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Cart", description: "Review digital artifacts in your cart." };

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

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import { getCurrentUser } from "@/lib/auth";
import { getOrder } from "@/server/services/order.service";
import { notFound, redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact } from "@/server/services/content-translation.service";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?returnTo=%2Fcheckout%2Fsuccess");
  if (!orderId) notFound();
  const [order, locale] = await Promise.all([getOrder(user.id, orderId), getRequestLocale()]);
  const localizedArtifacts = await Promise.all(order.items.map((item) =>
    getLocalizedArtifact(item.listing.artifact, locale)));
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <OrderConfirmation initialOrder={{
          id: order.id,
          total: order.total.toString(),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          status: order.status,
          items: order.items.map((item, index) => ({
            id: item.id,
            quantity: item.quantity,
            listing: { artifact: { title: localizedArtifacts[index].title } },
          })),
        }} />
      </main>
      <Footer />
    </>
  );
}

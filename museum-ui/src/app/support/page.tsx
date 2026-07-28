import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SupportCenter from "@/components/support/SupportCenter";
import { getCurrentUser } from "@/lib/auth";
import { listUserSupportRequests } from "@/server/services/support.service";

export const metadata = { title: "Queries & Feedback", description: "Ask the museum a question or share feedback." };

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?returnTo=%2Fsupport");
  const requests = await listUserSupportRequests(user.id);
  return <><Navbar hasHeroBackground={false} /><main className="min-h-[70vh] bg-cream px-6 py-16 text-ink md:px-10"><div className="mx-auto max-w-6xl"><SupportCenter initialRequests={requests.map((item) => ({ id: item.id, type: item.type, subject: item.subject, message: item.message, status: item.status, response: item.response, createdAt: item.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), responder: item.respondedBy?.name ?? null }))} /></div></main><Footer /></>;
}

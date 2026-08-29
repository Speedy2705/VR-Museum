import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { prisma } from "@/lib/prisma";
import { publicUploadToMarketplaceView } from "@/server/view-models";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedUpload } from "@/server/services/content-translation.service";
import { mapWithConcurrency } from "@/server/concurrency";

export default async function CommunityCreatorPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const creator = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      uploadedAssets: {
        where: { status: "APPROVED" },
        include: { owner: { select: { id: true, name: true } } },
        orderBy: { title: "asc" },
      },
    },
  });
  if (!creator) notFound();
  const localizedUploads = await mapWithConcurrency(creator.uploadedAssets, 8, (upload) => getLocalizedUpload(upload, locale));
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="min-h-[560px] bg-cream px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs tracking-label text-stone uppercase">Community creator</p>
          <h1 className="font-display mt-3 text-4xl italic">{creator.name ?? "Museum community member"}</h1>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {localizedUploads.map((upload) => (
              <ProductCard key={upload.id} product={publicUploadToMarketplaceView(upload, locale)} imageSizes="(min-width: 1024px) 25vw, 50vw" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

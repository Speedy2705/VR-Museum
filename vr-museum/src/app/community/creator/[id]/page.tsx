import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { prisma } from "@/lib/prisma";
import { publicUploadToMarketplaceView } from "@/server/view-models";

export default async function CommunityCreatorPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="min-h-[560px] bg-cream px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] tracking-label text-stone uppercase">Community creator</p>
          <h1 className="font-display mt-3 text-4xl italic">{creator.name ?? "Museum community member"}</h1>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {creator.uploadedAssets.map((upload) => (
              <ProductCard key={upload.id} product={publicUploadToMarketplaceView(upload)} imageSizes="(min-width: 1024px) 25vw, 50vw" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

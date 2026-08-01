import { redirect } from "next/navigation";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ModerationQueue from "@/components/moderation/ModerationQueue";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/role-policy";
import { listPendingUploads } from "@/server/services/upload.service";
import { listOpenReports } from "@/server/services/report.service";
import ReportQueue from "@/components/moderation/ReportQueue";
import SupportQueue from "@/components/moderation/SupportQueue";
import { listOpenSupportRequests } from "@/server/services/support.service";
import type { CollectionSlug, LightDirectionKey, LightTemperatureKey } from "@/lib/artifact-categories";
import type { ModelFormat } from "@/lib/three/loaders";

export const metadata = {
  title: "Upload Moderation",
  description: "Review artifact uploads awaiting curatorial approval.",
};

type ReviewMetadata = {
  description: string;
  origin: string;
  material: string;
  license: string;
  price: number | null;
};

function parseReviewMetadata(value: unknown): ReviewMetadata {
  const metadata = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    description: typeof metadata.description === "string" ? metadata.description : "",
    origin: typeof metadata.origin === "string" ? metadata.origin : "",
    material: typeof metadata.material === "string" ? metadata.material : "",
    license: typeof metadata.license === "string" ? metadata.license : "",
    price: typeof metadata.price === "number" && Number.isFinite(metadata.price) ? metadata.price : null,
  };
}

export default async function ModerationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?returnTo=%2Fmoderation");
  if (!hasPermission(user.role, "moderateUploads")) {
    redirect("/access-denied?reason=moderation");
  }
  const [uploads, reports, support] = await Promise.all([listPendingUploads(), listOpenReports(), listOpenSupportRequests()]);

  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main className="min-h-[65vh] bg-cream px-6 py-16 text-ink md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <p className="text-[10px] tracking-label uppercase text-stone">Moderation</p>
            <span className="bg-ink px-2.5 py-1 text-[9px] tracking-label uppercase text-white">Curator</span>
          </div>
          <h1 className="font-display mt-4 text-4xl italic">Curatorial review</h1>
          <div className="mt-10">
            <h2 className="font-display mb-5 text-2xl italic">Queries and feedback ({support.length})</h2>
            <SupportQueue initialItems={support.map((item) => ({ id: item.id, type: item.type, subject: item.subject, message: item.message, requester: item.requester.name ?? "Museum member", email: item.requester.email, createdAt: item.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) }))} />
          </div>
          <div className="mt-12 border-t border-line pt-10">
            <h2 className="font-display mb-5 text-2xl italic">Reported artifacts ({reports.length})</h2>
            <ReportQueue initialReports={reports.map((report) => ({
              id: report.id,
              uploadId: report.uploadId,
              title: report.artifactTitle,
              reason: report.reason,
              details: report.details,
              reporterId: report.reporterId,
              ownerName: report.upload?.owner.name ?? "Removed upload",
              ownerEmail: report.upload?.owner.email ?? "Not available",
              createdAt: report.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
            }))} />
          </div>
          <div className="mt-12 border-t border-line pt-10">
            <h2 className="font-display mb-5 text-2xl italic">Uploads awaiting review ({uploads.length})</h2>
            <ModerationQueue
              initialItems={uploads.map((upload) => {
                const details = parseReviewMetadata(upload.metadata);
                return {
                  id: upload.id,
                  title: upload.title,
                  category: upload.category as CollectionSlug,
                  ownerName: upload.owner.name ?? "Museum member",
                  ownerEmail: upload.owner.email,
                  lightTemperature: upload.lightTemperature as LightTemperatureKey | null,
                  lightDirection: upload.lightDirection as LightDirectionKey | null,
                  fileUrl: upload.fileUrl,
                  thumbnailUrl: upload.thumbnailUrl,
                  mediaType: upload.mediaType as "MODEL_3D" | "VIDEO",
                  modelFormat: upload.modelFormat as ModelFormat | null,
                  ...details,
                };
              })}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { museumToast } from "@/lib/museum-toast";

type ReportItem = {
  id: string;
  uploadId: string | null;
  title: string;
  reason: string;
  details: string | null;
  reporterId: string | null;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
};

const reasonLabels: Record<string, string> = {
  copyright: "Copyright or ownership",
  inaccurate: "Inaccurate information",
  offensive: "Offensive content",
  unsafe: "Unsafe file",
  other: "Other concern",
};

export default function ReportQueue({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState(initialReports);
  const [pendingId, setPendingId] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function resolve(id: string, action: "DISMISS" | "REMOVE") {
    setPendingId(id);
    try {
      const response = await fetch(`/api/moderation/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error();
      const target = reports.find((report) => report.id === id);
      const orphaned = action === "REMOVE" && !target?.uploadId;
      setReports((current) => action === "REMOVE" && target?.uploadId
        ? current.filter((report) => report.uploadId !== target.uploadId)
        : current.filter((report) => report.id !== id));
      setRemoveId(null);
      museumToast.success(orphaned ? "Report cleared" : action === "REMOVE" ? "Artifact removed" : "Report dismissed", orphaned ? "The upload had already been removed, so its remaining report was closed." : action === "REMOVE" ? "The artifact is no longer public or purchasable, and it was removed from active carts." : "The report has been closed with no artifact changes.");
    } catch {
      museumToast.error("Moderation action failed", "The report was not changed. Please try again.");
    } finally {
      setPendingId("");
    }
  }

  if (!reports.length) return <p className="border border-line bg-cream-dark px-6 py-8 text-sm text-stone">No artifact reports require review.</p>;

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <article key={report.id} className="border border-line p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <div className="max-w-2xl">
              <p className="text-[9px] tracking-label uppercase text-stone">{reasonLabels[report.reason] ?? report.reason} · {report.createdAt}</p>
              <h2 className="font-display mt-2 text-xl">{report.title}</h2>
              <p className="mt-2 text-xs text-stone">Uploaded by {report.ownerName} · {report.ownerEmail}</p>
              {report.details && <p className="mt-4 border-l-2 border-line pl-4 text-sm leading-relaxed text-charcoal">{report.details}</p>}
              {report.uploadId && <Link href={`/community/${report.uploadId}`} target="_blank" className="mt-4 inline-block text-[10px] tracking-label underline uppercase">Inspect artifact ↗</Link>}
            </div>
            <div className="flex shrink-0 items-start gap-3">
              <button type="button" disabled={pendingId === report.id} onClick={() => void resolve(report.id, "DISMISS")} className="border border-line px-5 py-2.5 text-[10px] tracking-label uppercase disabled:opacity-50">Dismiss</button>
              <button type="button" disabled={pendingId === report.id} onClick={() => setRemoveId(report.id)} className="bg-red-800 px-5 py-2.5 text-[10px] tracking-label text-white uppercase disabled:opacity-50">{report.uploadId ? "Remove Artifact" : "Clear Report"}</button>
            </div>
          </div>
        </article>
      ))}
      <ConfirmDialog open={removeId !== null} title={reports.find((report) => report.id === removeId)?.uploadId ? "Remove this artifact everywhere?" : "Clear this orphaned report?"} description={reports.find((report) => report.id === removeId)?.uploadId ? "This removes the upload from public pages, marketplace results, creator assets, and active carts. This action cannot be undone. Historical paid orders remain intact for buyer records." : "The associated upload has already been removed. This closes its remaining moderation report."} confirmLabel={reports.find((report) => report.id === removeId)?.uploadId ? "Remove Artifact" : "Clear Report"} pending={pendingId === removeId} onCancel={() => setRemoveId(null)} onConfirm={() => removeId ? resolve(removeId, "REMOVE") : undefined} />
    </div>
  );
}

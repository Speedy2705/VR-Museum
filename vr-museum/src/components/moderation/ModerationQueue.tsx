"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { museumToast } from "@/lib/museum-toast";
import { notifyError } from "@/lib/client-error";

type ModerationItem = {
  id: string;
  title: string;
  category: string;
  ownerName: string;
  ownerEmail: string;
};

export default function ModerationQueue({ initialItems }: { initialItems: ModerationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);

  async function moderate(id: string, status: "APPROVED" | "REJECTED") {
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(`/api/moderation/uploads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      setItems((current) => current.filter((item) => item.id !== id));
      museumToast.success(
        status === "APPROVED" ? "Upload approved" : "Upload rejected",
        "The contributor’s moderation queue has been updated.",
      );
      setRejectId(null);
    } catch (moderationError) {
      setError(notifyError(moderationError, "The moderation action could not be completed."));
    } finally {
      setPendingId("");
    }
  }

  if (!items.length) {
    return <p className="border border-line bg-cream-dark px-6 py-8 text-sm text-stone">No uploads are awaiting review.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {items.map((item) => (
        <article key={item.id} className="border border-line p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[9px] tracking-label uppercase text-stone">{item.category}</p>
              <h2 className="font-display mt-2 text-xl">{item.title}</h2>
              <p className="mt-2 text-xs text-stone">{item.ownerName} · {item.ownerEmail}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={pendingId === item.id}
                onClick={() => setRejectId(item.id)}
                className="border border-line px-5 py-2.5 text-[10px] tracking-label uppercase hover:border-ink disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={pendingId === item.id}
                onClick={() => moderate(item.id, "APPROVED")}
                className="bg-ink px-5 py-2.5 text-[10px] tracking-label uppercase text-white disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </article>
      ))}
      <ConfirmDialog
        open={rejectId !== null}
        title="Reject this upload?"
        description="The upload will be marked as rejected and removed from the moderation queue."
        confirmLabel="Reject Upload"
        pending={pendingId === rejectId}
        onCancel={() => setRejectId(null)}
        onConfirm={() => {
          if (rejectId) return moderate(rejectId, "REJECTED");
        }}
      />
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { museumToast } from "@/lib/museum-toast";
import { useSession } from "next-auth/react";
import SignInPrompt from "@/components/ui/SignInPrompt";
import LogoLoader from "@/components/ui/LogoLoader";

export default function ReportFlagButton({ uploadId, artifactSlug }: { uploadId?: string; artifactSlug?: string }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState("inaccurate");
  const [details, setDetails] = useState("");
  const { status } = useSession();
  const [signInPrompt, setSignInPrompt] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, artifactSlug, reason, details: details.trim() || undefined }),
      });
      if (!response.ok) throw new Error();
      setSent(true);
      setOpen(false);
      museumToast.info("Report received", "A curator will verify this artifact and take action if needed.");
    } catch {
      museumToast.error("Report not sent", "Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button type="button" disabled={sent} onClick={() => status === "authenticated" ? setOpen(true) : setSignInPrompt(true)} className="text-xs tracking-label text-stone underline uppercase disabled:opacity-60">
        {sent ? "Reported for review" : "Report this upload"}
      </button>
      <SignInPrompt open={signInPrompt} onClose={() => setSignInPrompt(false)} title="Sign in to report an artifact" description="Reports are accepted only from signed-in museum members." returnTo={uploadId ? `/community/${uploadId}` : `/vr/${artifactSlug}`} />
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-lg bg-cream p-7 shadow-xl">
            <p className="text-xs tracking-label uppercase text-stone">Community safety</p>
            <h2 id="report-title" className="font-display mt-2 text-2xl italic">Report this artifact</h2>
            <p className="mt-3 text-sm text-stone">Tell the curator what should be verified. Reports do not remove an artifact automatically.</p>
            <label className="mt-5 block text-xs tracking-label uppercase text-stone">Reason
              <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 block w-full border border-line bg-cream px-3 py-3 text-sm normal-case tracking-normal text-ink">
                <option value="inaccurate">Inaccurate or misleading information</option>
                <option value="copyright">Copyright or ownership concern</option>
                <option value="offensive">Offensive or inappropriate content</option>
                <option value="unsafe">Unsafe or malicious file</option>
                <option value="other">Other concern</option>
              </select>
            </label>
            <label className="mt-4 block text-xs tracking-label uppercase text-stone">Details (optional)
              <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={4} className="mt-2 block w-full resize-y border border-line bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-ink" placeholder="Add evidence or context for the curator…" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={sending} onClick={() => setOpen(false)} className="border border-line px-5 py-2.5 text-xs tracking-label uppercase">Cancel</button>
              <button type="submit" disabled={sending} className="bg-ink px-5 py-2.5 text-xs tracking-label text-white uppercase disabled:opacity-60">{sending ? <><LogoLoader label="Submitting report" size="sm" tone="light" showLabel={false} className="me-2 align-middle" />Submitting…</> : "Submit Report"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

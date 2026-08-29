"use client";

import { useEffect, useState, type FormEvent } from "react";
import { museumToast } from "@/lib/museum-toast";

type RequestItem = { id: string; type: "QUERY" | "FEEDBACK"; subject: string; message: string; status: "OPEN" | "ANSWERED"; response: string | null; createdAt: string; responder: string | null };

export default function SupportCenter({ initialRequests }: { initialRequests: RequestItem[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [type, setType] = useState<"QUERY" | "FEEDBACK">("QUERY");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [category, setCategory] = useState("GENERAL");

  useEffect(() => {
    const saved = window.localStorage.getItem("viswaroop-support-draft");
    if (!saved) return;
    try {
      const draft = JSON.parse(saved) as { subject?: string; message?: string; category?: string };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the member's unsent local draft
      setSubject(draft.subject ?? ""); setMessage(draft.message ?? ""); setCategory(draft.category ?? "GENERAL");
    } catch { window.localStorage.removeItem("viswaroop-support-draft"); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (subject || message) window.localStorage.setItem("viswaroop-support-draft", JSON.stringify({ subject, message, category }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [subject, message, category]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true);
    try {
      const categorizedSubject = `[${category}] ${subject.trim()}`;
      const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, subject: categorizedSubject, message }) });
      const body = await response.json() as { success: boolean; data?: { id: string }; error?: { message?: string } };
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Submission failed");
      setRequests((items) => [{ id: body.data!.id, type, subject: categorizedSubject, message: message.trim(), status: "OPEN", response: null, createdAt: "Just now", responder: null }, ...items]);
      setSubject(""); setMessage("");
      window.localStorage.removeItem("viswaroop-support-draft");
      museumToast.success("Message submitted", `Reference ${body.data.id}. A curator will review it within 3–5 working days.`);
    } catch (error) { museumToast.error("Not submitted", error instanceof Error ? error.message : "Please try again."); }
    finally { setSending(false); }
  }

  const field = "mt-2 w-full border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";
  return <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
    <form onSubmit={submit} className="border border-line p-6 md:p-8">
      <p className="text-xs tracking-label uppercase text-stone">Contact the museum</p><h1 className="font-display mt-2 text-3xl italic">Ask a question or share feedback</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone">A curator normally responds within 3–5 working days. Your unfinished message is saved on this device.</p>
      <label className="mt-7 block text-xs tracking-label uppercase text-stone">Message type<select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={field}><option value="QUERY">Question</option><option value="FEEDBACK">Feedback</option></select></label>
      <label className="mt-5 block text-xs tracking-label uppercase text-stone">Topic<select value={category} onChange={(e) => setCategory(e.target.value)} className={field}><option value="GENERAL">General</option><option value="ACCOUNT">Account</option><option value="PAYMENT">Payment</option><option value="LICENSE">Licensing</option><option value="ARTIFACT">Artifact information</option><option value="UPLOAD">Uploading</option><option value="ACCESSIBILITY">Accessibility</option></select></label>
      <label className="mt-5 block text-xs tracking-label uppercase text-stone">Subject <span className="text-red-700">*</span><input required minLength={3} maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} className={field} /><span className="mt-1 block text-right text-xs text-stone">{subject.length} / 120</span></label>
      <label className="mt-5 block text-xs tracking-label uppercase text-stone">Message <span className="text-red-700">*</span><textarea required minLength={10} maxLength={3000} rows={7} value={message} onChange={(e) => setMessage(e.target.value)} className={`${field} resize-y`} /><span className="mt-1 block text-right text-xs text-stone">{message.length} / 3,000</span></label>
      <button disabled={sending} className="mt-6 bg-ink px-7 py-3.5 text-xs tracking-label uppercase text-white disabled:opacity-60">{sending ? "Submitting…" : "Submit"}</button>
    </form>
    <section><p className="text-xs tracking-label uppercase text-stone">Your messages</p><h2 className="font-display mt-2 text-3xl italic">Submission history</h2>
      <div className="mt-6 space-y-4">{requests.length ? requests.map((item) => <article key={item.id} className="border border-line p-6"><div className="flex justify-between gap-4"><p className="text-xs tracking-label uppercase text-stone">{item.type} · {item.createdAt}</p><span className="bg-cream-dark px-2 py-1 text-xs tracking-label uppercase">{item.status}</span></div><h3 className="font-display mt-2 text-xl">{item.subject}</h3><p className="mt-3 text-sm leading-relaxed text-charcoal">{item.message}</p>{item.response && <div className="mt-5 border-l-2 border-ink bg-cream-dark p-4"><p className="text-xs tracking-label uppercase text-stone">Response{item.responder ? ` from ${item.responder}` : ""}</p><p className="mt-2 text-sm leading-relaxed">{item.response}</p></div>}</article>) : <p className="border border-line p-8 text-sm text-stone">You have not submitted any messages yet.</p>}</div>
    </section>
  </div>;
}

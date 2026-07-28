"use client";

import { useState, type FormEvent } from "react";
import { museumToast } from "@/lib/museum-toast";

type RequestItem = { id: string; type: "QUERY" | "FEEDBACK"; subject: string; message: string; status: "OPEN" | "ANSWERED"; response: string | null; createdAt: string; responder: string | null };

export default function SupportCenter({ initialRequests }: { initialRequests: RequestItem[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [type, setType] = useState<"QUERY" | "FEEDBACK">("QUERY");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true);
    try {
      const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, subject, message }) });
      const body = await response.json() as { success: boolean; data?: { id: string }; error?: { message?: string } };
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Submission failed");
      setRequests((items) => [{ id: body.data!.id, type, subject: subject.trim(), message: message.trim(), status: "OPEN", response: null, createdAt: "Just now", responder: null }, ...items]);
      setSubject(""); setMessage("");
      museumToast.success("Submitted", "A curator will review your message.");
    } catch (error) { museumToast.error("Not submitted", error instanceof Error ? error.message : "Please try again."); }
    finally { setSending(false); }
  }

  const field = "mt-2 w-full border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";
  return <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
    <form onSubmit={submit} className="border border-line p-6 md:p-8">
      <p className="text-[10px] tracking-label uppercase text-stone">Contact the museum</p><h1 className="font-display mt-2 text-3xl italic">Ask a query or share feedback</h1>
      <label className="mt-7 block text-[10px] tracking-label uppercase text-stone">Message type<select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={field}><option value="QUERY">Query</option><option value="FEEDBACK">Feedback</option></select></label>
      <label className="mt-5 block text-[10px] tracking-label uppercase text-stone">Subject<input required minLength={3} maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} className={field} /></label>
      <label className="mt-5 block text-[10px] tracking-label uppercase text-stone">Message<textarea required minLength={10} maxLength={3000} rows={7} value={message} onChange={(e) => setMessage(e.target.value)} className={`${field} resize-y`} /></label>
      <button disabled={sending} className="mt-6 bg-ink px-7 py-3.5 text-[11px] tracking-label uppercase text-white disabled:opacity-60">{sending ? "Submitting…" : "Submit"}</button>
    </form>
    <section><p className="text-[10px] tracking-label uppercase text-stone">Your messages</p><h2 className="font-display mt-2 text-3xl italic">Submission history</h2>
      <div className="mt-6 space-y-4">{requests.length ? requests.map((item) => <article key={item.id} className="border border-line p-6"><div className="flex justify-between gap-4"><p className="text-[9px] tracking-label uppercase text-stone">{item.type} · {item.createdAt}</p><span className="bg-cream-dark px-2 py-1 text-[9px] tracking-label uppercase">{item.status}</span></div><h3 className="font-display mt-2 text-xl">{item.subject}</h3><p className="mt-3 text-sm leading-relaxed text-charcoal">{item.message}</p>{item.response && <div className="mt-5 border-l-2 border-ink bg-cream-dark p-4"><p className="text-[9px] tracking-label uppercase text-stone">Response{item.responder ? ` from ${item.responder}` : ""}</p><p className="mt-2 text-sm leading-relaxed">{item.response}</p></div>}</article>) : <p className="border border-line p-8 text-sm text-stone">You have not submitted any messages yet.</p>}</div>
    </section>
  </div>;
}

"use client";
import { useState } from "react";
import { museumToast } from "@/lib/museum-toast";
import LogoLoader from "@/components/ui/LogoLoader";

type Item = { id: string; type: string; subject: string; message: string; requester: string; email: string; createdAt: string };
export default function SupportQueue({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems); const [responses, setResponses] = useState<Record<string,string>>({}); const [pending, setPending] = useState("");
  async function answer(id: string) { setPending(id); try { const response = await fetch(`/api/moderation/support/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ response: responses[id] ?? "" }) }); if (!response.ok) throw new Error(); setItems((all) => all.filter((item) => item.id !== id)); museumToast.success("Response sent", "The member can now see the curator response."); } catch { museumToast.error("Response not sent", "Please check the response and try again."); } finally { setPending(""); } }
  if (!items.length) return <p className="border border-line bg-cream-dark px-6 py-8 text-sm text-stone">No queries or feedback require a response.</p>;
  return <div className="space-y-4">{items.map((item) => <article key={item.id} className="border border-line p-6"><p className="text-xs tracking-label uppercase text-stone">{item.type} · {item.createdAt}</p><h3 className="font-display mt-2 text-xl">{item.subject}</h3><p className="mt-1 text-xs text-stone">From {item.requester} · {item.email}</p><p className="mt-4 text-sm leading-relaxed">{item.message}</p><textarea aria-label={`Response to ${item.subject}`} rows={4} maxLength={3000} value={responses[item.id] ?? ""} onChange={(e) => setResponses((all) => ({ ...all, [item.id]: e.target.value }))} className="mt-5 w-full resize-y border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-ink" placeholder="Write a helpful response…"/><button type="button" disabled={pending === item.id || (responses[item.id]?.trim().length ?? 0) < 3} onClick={() => answer(item.id)} className="mt-3 bg-ink px-5 py-3 text-xs tracking-label uppercase text-white disabled:opacity-50">{pending === item.id ? <LogoLoader label="Sending response" size="sm" tone="light" /> : "Send Response"}</button></article>)}</div>;
}

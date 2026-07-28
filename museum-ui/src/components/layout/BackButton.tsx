"use client";
import { usePathname, useRouter } from "next/navigation";

const excluded = new Set(["/", "/sign-in", "/sign-up"]);
export default function BackButton() {
  const pathname = usePathname(); const router = useRouter();
  if (excluded.has(pathname)) return null;
  return <button type="button" onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 border border-line bg-cream/95 px-4 py-3 text-[10px] tracking-label uppercase text-ink shadow-lg backdrop-blur hover:bg-white" aria-label="Go back"><span aria-hidden="true">←</span> Back</button>;
}

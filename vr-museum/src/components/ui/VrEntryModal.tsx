"use client";
import Link from "next/link";

type Props = { label?: string; variant?: "filled" | "outline" | "dark"; className?: string; compact?: boolean; href?: string };
export default function VrEntryModal({ label = "Open 3D Gallery", variant = "filled", className = "", compact = false, href = "/vr" }: Props) {
  const style = variant === "filled" ? "bg-cream text-ink hover:bg-white" : variant === "dark" ? "bg-ink text-white hover:bg-charcoal" : "border border-line-dark text-cream hover:bg-white/5";
  return <Link href={href} aria-label={label} className={`inline-flex items-center justify-center gap-2 text-xs tracking-label whitespace-nowrap uppercase transition-colors ${compact ? "h-9 w-9 p-0 xl:h-auto xl:w-auto xl:px-5 xl:py-2.5" : "px-7 py-3.5"} ${style} ${className}`}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="8" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg><span className={compact ? "hidden xl:inline" : undefined}>{label}</span>
  </Link>;
}

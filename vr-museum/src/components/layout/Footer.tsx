"use client";

import Link from "next/link";
import { useRole } from "@/hooks/useRole";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Collections", href: "/collections" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Featured", href: "/marketplace#featured" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Upload Model", href: "/upload" },
      { label: "Your Assets", href: "/assets" },
      { label: "Sign In", href: "/sign-in" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const socials = [
  {
    label: "X",
    href: "https://x.com",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.7l-5.2-6.8L5.6 22H2.4l8.1-9.3L1.5 2h6.8l4.7 6.2L18.9 2Zm-1.2 18.2h1.7L7.4 3.7H5.6l12.1 16.5Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { canUpload } = useRole();
  return (
    <footer className="bg-ink px-10 pt-20 pb-8 text-white">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg tracking-[0.2em]">ViswaRoop</p>
          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Explore. Experience. Own History.
            <br />
            Est. 2025
            <br />
            Global · Online · VR
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] tracking-label uppercase text-white/40">
              {col.title}
            </p>
            <ul className="mt-4 space-y-3">
              {col.links
                .filter((link) => link.href !== "/upload" || canUpload)
                .map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-[1600px] flex-col items-center justify-between gap-4 border-t border-line-dark pt-6 md:flex-row">
        <p data-no-translate className="text-xs text-white/40">© 2025 ViswaRoop. All rights reserved.</p>
        <div className="flex items-center gap-5">
          {socials.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className="text-white/60 hover:text-white"
            >
              {s.icon}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

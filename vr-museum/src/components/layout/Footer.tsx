"use client";

import Link from "next/link";
import { useRole } from "@/hooks/useRole";
import BrandLogo from "@/components/ui/BrandLogo";

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
      { label: "Contribute Artifact", href: "/upload" },
      { label: "Your Assets", href: "/assets" },
      { label: "Sign In", href: "/sign-in" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Meet the Core Team", href: "/about#core-team" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  const { canUpload } = useRole();
  return (
    <footer className="bg-ink px-5 pt-16 pb-8 text-white sm:px-6 md:px-10 md:pt-20">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-12 md:grid-cols-4">
        <div>
          <BrandLogo variant="light" className="h-auto w-44" />
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Explore. Experience. Discover Living History.
            <br />
            A multilingual museum for cultural discovery,
            <br />
            immersive 3D, and licensed digital artifacts.
            <br />
            Funded by ICSSR.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-xs tracking-label uppercase text-white/70">
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
        <p data-no-translate className="text-xs text-white/70">© {new Date().getFullYear()} ViswaRoop. All rights reserved.</p>
      </div>
    </footer>
  );
}

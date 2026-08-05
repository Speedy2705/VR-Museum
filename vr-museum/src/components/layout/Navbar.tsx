"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import CartIcon from "@/components/ui/CartIcon";
import VrEntryModal from "@/components/ui/VrEntryModal";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { notifyError } from "@/lib/client-error";
import { userRoles } from "@/lib/validators/user";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useRole } from "@/hooks/useRole";
import BackButton from "@/components/layout/BackButton";
import { LanguageSelector, useI18n } from "@/context/I18nContext";
import { localizePath } from "@/lib/i18n";

/*
 * Visual regression checklist
 * - / and /marketplace: transparent overlay with white text at the top; solid after scrolling.
 * - /collections, /collections/[slug], /collections/[slug]/[artifact]: solid at top and while scrolled.
 * - /marketplace/[slug], /cart, /checkout, /checkout/success: solid at top and while scrolled.
 * - /upload, /assets, /about, /moderation: solid at top and while scrolled.
 * - /sign-in, /sign-up, /complete-profile, /access-denied: solid at top and while scrolled.
 * - /community/[id], /community/creator/[id]: solid at top and while scrolled.
 * - /terms, /privacy, and not-found: solid at top and while scrolled.
 * - Every route: menu, account, and search open states use the same solid header surface.
 */
const NAVBAR_TRANSITION_DURATION = 0.25;
const NAVBAR_SCROLL_THRESHOLD = 24;
const NAVBAR_TOP_PADDING = 0;
const NAVBAR_SCROLLED_PADDING = 0;
const NAVBAR_SOLID_BACKGROUND = "rgba(23, 19, 15, 0.96)";
const NAVBAR_OVERLAY_BACKGROUND = "rgba(23, 19, 15, 0)";
const NAVBAR_SOLID_BLUR = "blur(14px)";
const NAVBAR_NO_BLUR = "blur(0px)";

type NavbarProps = {
  hasHeroBackground?: boolean;
};

export default function Navbar({ hasHeroBackground = false }: NavbarProps) {
  const { locale, messages: t } = useI18n();
  const href = (path: string) => localizePath(path, locale);
  const leftLinks = [
    { label: t.collections, href: "/collections" },
    { label: t.marketplace, href: "/marketplace" },
    { label: t.about, href: "/about" },
  ];
  const accountLinks = [
    { label: t.assets, href: "/assets" },
    { label: t.upload, href: "/upload" },
    { label: t.support, href: "/support" },
  ];
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<
    { slug: string; title: string; collection: { slug: string; title: string } }[]
  >([]);
  const reduceMotion = useReducedMotion();
  const accountRef = useRef<HTMLDivElement>(null);
  const user = session?.user;
  const initial = (user?.name ?? user?.email ?? "A").charAt(0).toUpperCase();
  const roleLabel = userRoles.find((role) => role.value === user?.role)?.label;
  const { canUpload, canModerateUploads } = useRole();
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > NAVBAR_SCROLL_THRESHOLD);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/artifacts?query=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          success: boolean;
          data?: { slug: string; title: string; collection: { slug: string; title: string } }[];
          error?: { message?: string };
        };
        if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Search failed");
        setResults(body.data ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          notifyError(error, "Museum search is unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchOpen]);

  const hasOpenSurface = menuOpen || accountOpen || searchOpen;
  const isSolid = !hasHeroBackground || scrolled || hasOpenSurface;
  const transition = { duration: reduceMotion ? 0 : NAVBAR_TRANSITION_DURATION };

  return (
    <>
    <motion.header
      initial={false}
      animate={{
        backgroundColor: isSolid ? NAVBAR_SOLID_BACKGROUND : NAVBAR_OVERLAY_BACKGROUND,
        backdropFilter: isSolid ? NAVBAR_SOLID_BLUR : NAVBAR_NO_BLUR,
      }}
      transition={transition}
      className={
        "fixed top-0 left-0 z-30 h-20 w-full text-white"
      }
    >
      <motion.nav
        animate={{
          paddingTop: scrolled ? NAVBAR_SCROLLED_PADDING : NAVBAR_TOP_PADDING,
          paddingBottom: scrolled ? NAVBAR_SCROLLED_PADDING : NAVBAR_TOP_PADDING,
        }}
        transition={transition}
        className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-10"
      >
        <BackButton />
        <button
          type="button"
          className="flex shrink-0 text-current xl:hidden"
          aria-label={menuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((value) => !value);
            setAccountOpen(false);
          }}
        >
          <span className="text-xl">{menuOpen ? "×" : "☰"}</span>
        </button>
        <ul className="hidden flex-1 items-center gap-8 xl:flex">
          {leftLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={href(link.href)}
                className="text-[11px] tracking-label uppercase text-current opacity-75 transition-opacity hover:opacity-100"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={href("/")}
          className="font-display flex-1 text-center text-lg tracking-[0.25em] text-current xl:flex-none xl:text-xl xl:tracking-[0.3em]"
        >
          ViswaRoop
        </Link>

        <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-5 xl:flex-1 xl:gap-7">
          {user ? (
            <div ref={accountRef} className="relative order-last xl:order-none">
              <button
                type="button"
                className="flex items-center rounded-full text-xs text-current outline-none opacity-80 ring-cream/60 hover:opacity-100 focus-visible:ring-2"
                aria-label={t.accountMenu}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => {
                  setAccountOpen((value) => !value);
                  setMenuOpen(false);
                }}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Auth.js profile URLs are not constrained to configured hosts
                  <img
                    src={user.image}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-cream text-[11px] font-semibold text-ink">
                    {initial}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    role="menu"
                    initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    className="absolute top-full right-0 z-40 mt-3 w-64 border border-white/15 bg-ink p-2 text-white shadow-2xl"
                  >
                    <div className="px-3 py-3">
                      <p className="font-display truncate text-base">{user.name ?? t.account}</p>
                      <p className="mt-1 truncate text-xs text-white/50">
                        {user.email ?? t.mobileAccount}
                      </p>
                      {roleLabel && (
                        <p className="mt-2 text-[9px] tracking-label uppercase text-white/40">
                          {roleLabel}
                        </p>
                      )}
                    </div>
                    <div className="border-t border-white/10 py-1">
                      {accountLinks.filter((link) => link.href !== "/upload" || canUpload).map((link) => (
                        <Link
                          key={link.href}
                          role="menuitem"
                          href={href(link.href)}
                          onClick={() => setAccountOpen(false)}
                          className="block px-3 py-2.5 text-[11px] tracking-label uppercase text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                      {canModerateUploads && (
                        <Link
                          role="menuitem"
                          href={href("/moderation")}
                          onClick={() => setAccountOpen(false)}
                          className="block px-3 py-2.5 text-[11px] tracking-label uppercase text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {t.moderate}
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-white/10 pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountOpen(false);
                          setSignOutOpen(true);
                        }}
                        className="w-full px-3 py-2.5 text-left text-[11px] tracking-label uppercase text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        {t.signOut}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : status !== "loading" ? (
            <Link
              href={href("/sign-in")}
              className="hidden text-[11px] tracking-label uppercase text-current opacity-75 transition-opacity hover:opacity-100 xl:block"
            >
              {t.signIn}
            </Link>
          ) : null}
          <CartIcon />
          <LanguageSelector authenticated={Boolean(user)} />
          <button
            type="button"
            onClick={() => {
              setSearchOpen((value) => !value);
              setAccountOpen(false);
            }}
            aria-label={t.search}
            aria-expanded={searchOpen}
            className="text-current opacity-80 hover:opacity-100"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" strokeLinecap="round" />
            </svg>
          </button>
          <VrEntryModal
            label={t.enterVr}
            compact
            variant={isSolid || hasHeroBackground ? "filled" : "dark"}
          />
        </div>
      </motion.nav>
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            className="border-t border-white/10 bg-ink/95 px-6 py-4 backdrop-blur md:px-10"
          >
            <div className="relative mx-auto max-w-2xl">
              <label htmlFor="navbar-search" className="sr-only">{t.search}</label>
              <input
                id="navbar-search"
                autoFocus
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  if (value.trim().length < 2) {
                    setResults([]);
                    setSearching(false);
                  }
                }}
                placeholder={t.searchPlaceholder}
                className="w-full border-b border-white/25 bg-transparent px-1 py-3 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
              />
              {query.trim().length >= 2 && (
                <div className="absolute top-full right-0 left-0 z-40 max-h-80 overflow-y-auto border border-line bg-cream text-ink shadow-xl">
                  {searching ? (
                    <p className="px-5 py-5 text-sm text-stone">{t.searching}</p>
                  ) : results.length ? (
                    results.map((result) => (
                      <Link
                        key={result.slug}
                        href={href(`/collections/${result.collection.slug}/${result.slug}`)}
                        onClick={() => setSearchOpen(false)}
                        className="block border-b border-line px-5 py-4 last:border-0 hover:bg-cream-dark"
                      >
                        <span className="block text-sm">{result.title}</span>
                        <span className="mt-1 block text-[10px] tracking-label text-stone uppercase">{result.collection.title}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="px-5 py-5 text-sm text-stone">{t.noResults}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={transition}
            className="border-t border-white/10 px-6 py-6 text-white xl:hidden"
          >
            <div className="flex flex-col gap-5">
              {[
                ...leftLinks,
                ...(!user && status !== "loading"
                  ? [{ label: t.signIn, href: "/sign-in" }]
                  : []),
              ].map((link) => (
                <Link
                  key={link.href}
                  href={href(link.href)}
                  onClick={() => setMenuOpen(false)}
                  className="text-[11px] tracking-label uppercase text-white/80"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={signOutOpen}
        title={t.signOutTitle}
        description={t.signOutDescription}
        confirmLabel={t.signOut}
        tone="important"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => signOut({ redirectTo: href("/") })}
      />
    </motion.header>
    {!hasHeroBackground && <div aria-hidden="true" className="h-20 shrink-0" />}
    </>
  );
}

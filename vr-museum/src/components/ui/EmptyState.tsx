import Link from "next/link";

export default function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-line bg-cream-dark/40 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-line text-stone" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4M8.5 11h5" strokeLinecap="round" />
        </svg>
      </span>
      <h2 className="font-display mt-5 text-2xl italic">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone">{message}</p>
      {action && (
        <Link href={action.href} className="mt-7 bg-ink px-6 py-3 text-xs tracking-label text-cream uppercase">
          {action.label}
        </Link>
      )}
    </div>
  );
}

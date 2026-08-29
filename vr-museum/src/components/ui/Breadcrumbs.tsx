import Link from "next/link";

export default function Breadcrumbs({
  items,
  light = false,
}: {
  items: { label: string; href?: string }[];
  light?: boolean;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={`flex flex-wrap items-center gap-2 text-xs tracking-label uppercase ${light ? "text-white/65" : "text-stone"}`}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className={light ? "hover:text-white" : "hover:text-ink"}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={light ? "text-white" : "text-ink"}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

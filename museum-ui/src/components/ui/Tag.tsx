type TagProps = {
  children: string;
  className?: string;
};

export default function Tag({ children, className = "" }: TagProps) {
  return (
    <span
      className={`inline-block bg-cream/90 px-2.5 py-1.5 text-[9px] tracking-label text-ink uppercase ${className}`}
    >
      {children}
    </span>
  );
}

type LogoLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "light";
  showLabel?: boolean;
  className?: string;
};

const pieces = [
  { d: "M373.5 174.94c-36.57 19.35-23.45 42.37-64.47 33.34 25.03-25.54 22.14-17.09 64.47-33.34Z", gold: true },
  { d: "M373.5 174.94c-40.95 5.86-45.15-22.66-73.02 8.78 35.26 5.94 29.23 2.97 73.02-8.78Z", gold: true },
  { d: "M261.33 210.3c36.58-19.33 58.63-68.74 99.66-59.68-25.04 25.52-57.32 43.45-99.66 59.68Z" },
  { d: "M260.99 210.67c40.96-5.84 87.82 21.21 115.72-10.21-35.27-5.96-71.92-1.53-115.72 10.21Z" },
  { d: "M383.74 170.96c-4.63-14.17-35.78-16.71-26.03-19.9 9.74-3.18 21.4 5.73 26.03 19.9 4.63 14.17.49 28.25-9.26 31.43-9.74 3.19 13.89-17.26 9.26-31.43Z" },
  { d: "M329.09 154.05c-37.2 19.11-60.11 68.44-101.44 59.11 25.63-25.39 58.46-43.14 101.44-59.11Z" },
  { d: "M329.44 153.68c-41.45 5.58-88.44-21.79-117.02 9.49 35.54 6.18 72.62 1.98 117.02-9.49Z" },
  { d: "M215.71 188.59c37.18-19.13 24.22-42.27 65.56-32.96-25.61 25.41-22.59 16.97-65.56 32.96Z", gold: true },
  { d: "M215.71 188.59c41.44-5.6 45.32 22.97 73.88-8.58-35.55-6.16-29.49-3.16-73.88 8.58Z", gold: true },
  { d: "M206.38 193.28c4.98 14.06 36.48 15.74 26.7 19.2-9.77 3.45-21.72-5.14-26.7-19.2-4.97-14.06-1.08-28.26 8.7-31.72 9.77-3.45-13.67 17.66-8.7 31.72Z" },
  { d: "M203.31 170.03c-5.62.14-10.03 6.15-9.85 13.42.18 7.28 4.88 13.06 10.5 12.92 5.62-.14-13.46-5.57-13.64-12.84-.18-7.28 18.61-13.64 12.99-13.5Z" },
  { d: "M386.69 194.67c5.62-.14 10.03-6.15 9.85-13.42-.18-7.28-4.88-13.06-10.5-12.92-5.62.14 13.46 5.57 13.64 12.84.18 7.28-18.61 13.64-12.99 13.5Z" },
];

const sizes = { sm: "w-5", md: "w-24", lg: "w-40" };

export default function LogoLoader({ label = "Loading", size = "md", tone = "ink", showLabel = true, className = "" }: LogoLoaderProps) {
  const base = tone === "light" ? "#f4efe4" : "#17130f";
  return (
    <div className={`logo-loader inline-flex flex-col items-center justify-center ${className}`} role="status" aria-live="polite">
      <svg aria-hidden="true" viewBox="185 145 220 75" className={`${sizes[size]} h-auto overflow-visible`}>
        <g fill="none">
          {pieces.map((piece, index) => (
            <path
              key={piece.d}
              d={piece.d}
              fill={piece.gold ? (tone === "light" ? "#dec9a5" : "#b88932") : base}
              className="logo-loader__piece"
              style={{ "--piece": index } as React.CSSProperties}
            />
          ))}
        </g>
      </svg>
      {showLabel && <span className={`${size === "sm" ? "sr-only" : "mt-4 text-xs tracking-label uppercase"}`}>{label}</span>}
      {!showLabel && <span className="sr-only">{label}</span>}
    </div>
  );
}

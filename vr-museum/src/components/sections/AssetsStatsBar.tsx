type Stat = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const trendIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const tagIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2 3 11v9a2 2 0 0 0 2 2h4v-6h6v6h4a2 2 0 0 0 2-2v-9L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const uploadIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type AssetsStatsBarProps = {
  totalEarnings: number;
  itemsSold: number;
  activeListings: number;
};

export default function AssetsStatsBar({
  totalEarnings,
  itemsSold,
  activeListings,
}: AssetsStatsBarProps) {
  const stats: Stat[] = [
    {
      label: "Total Earnings",
      value: `$${totalEarnings.toLocaleString()}`,
      icon: trendIcon,
    },
    { label: "Items Sold", value: `${itemsSold}`, icon: tagIcon },
    {
      label: "Active Listings",
      value: `${activeListings}`,
      icon: uploadIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 divide-y divide-line border-b border-line bg-cream-dark sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <div key={s.label} className="px-10 py-7 md:px-16">
          <p className="flex items-center gap-1.5 text-xs tracking-label text-stone uppercase">
            {s.icon}
            {s.label}
          </p>
          <p className="font-display mt-1.5 text-3xl italic">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

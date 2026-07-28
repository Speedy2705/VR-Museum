import VrEntryModal from "@/components/ui/VrEntryModal";

type CollectionInfoBarProps = {
  description: string;
  vrTitle?: string;
  vrDescription?: string;
};

export default function CollectionInfoBar({
  description,
  vrTitle = "Experience in VR",
  vrDescription = "Walk through this entire collection at full scale with studio-grade lighting controls.",
}: CollectionInfoBarProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[1fr_420px]">
      <div className="bg-cream px-10 py-10 md:px-16">
        <p className="max-w-2xl text-sm leading-relaxed text-charcoal/80">
          {description}
        </p>
      </div>

      <div className="bg-ink px-10 py-10 text-white md:px-12">
        <h2 className="font-display text-2xl italic">{vrTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          {vrDescription}
        </p>
        <VrEntryModal className="mt-6 w-full" />
      </div>
    </section>
  );
}

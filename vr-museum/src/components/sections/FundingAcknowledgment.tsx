import SlideUp from "@/components/motion/SlideUp";

export default function FundingAcknowledgment() {
  return (
    <section className="border-y border-line bg-cream px-6 py-16 text-ink md:px-10 md:py-20">
      <SlideUp className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.6fr_1.4fr] md:items-start">
        <p className="text-xs tracking-[0.3em] text-stone uppercase">
          Research Support
        </p>
        <div>
          <h2 className="font-display text-3xl italic md:text-4xl">
            Funded by ICSSR
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-charcoal/75">
            ViswaRoop is funded by the Indian Council of Social Science Research
            (ICSSR). This support advances the project’s work in cultural
            documentation, accessible digital interpretation, and immersive
            public engagement with heritage.
          </p>
        </div>
      </SlideUp>
    </section>
  );
}

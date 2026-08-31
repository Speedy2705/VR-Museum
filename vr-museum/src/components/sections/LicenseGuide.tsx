const licenses = [
  { name: "CC0 — Public Domain", summary: "Use, adapt, share, or sell the work without asking permission or giving credit." },
  { name: "CC BY 4.0", summary: "Use and adapt the work, including commercially, when you credit the original creator." },
  { name: "CC BY-SA 4.0", summary: "Use and adapt with creator credit; adaptations must be shared under the same license." },
  { name: "Personal Use Only", summary: "Use the purchased work privately, but not in commercial projects or for resale." },
  { name: "Commercial Use", summary: "Use the work in a commercial project under the specific license supplied with the item." },
];

export default function LicenseGuide() {
  return (
    <section id="license-guide" aria-labelledby="license-guide-title" className="scroll-mt-24 border-y border-line bg-cream-dark px-10 py-16 md:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="max-w-3xl">
          <p className="text-xs tracking-label font-medium text-charcoal uppercase">License guide</p>
          <h2 id="license-guide-title" className="font-display mt-3 text-4xl italic text-ink">Know how each artifact may be used</h2>
          <p className="mt-4 text-[15px] leading-7 text-charcoal">The badge on every marketplace item identifies its reuse terms. Always review the item’s full license notice before downloading or purchasing.</p>
        </div>
        <dl className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {licenses.map((license) => (
            <div key={license.name} className="border border-ink/15 bg-cream p-5">
              <dt data-no-translate className="text-sm font-medium text-ink">{license.name}</dt>
              <dd className="mt-3 text-sm leading-6 text-charcoal">{license.summary}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs leading-5 text-charcoal">This guide is a plain-language summary, not a replacement for the complete license terms attached to an item.</p>
      </div>
    </section>
  );
}

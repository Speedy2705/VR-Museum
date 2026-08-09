import SlideUp from "@/components/motion/SlideUp";

const teamGroups = [
  {
    title: "Research Leadership",
    members: [
      { name: "Dr. Amrita Bhattacharjee", role: "Principal Investigator" },
      { name: "Ms. Krishna Goala", role: "Researcher" },
    ],
  },
  {
    title: "Development",
    members: [
      { name: "Mr. Aryan Kesarwani", role: "Website Developer" },
    ],
  },
  {
    title: "Design",
    members: [
      { name: "Mr. R. Sabarish Raghav", role: "UI and VR Designer" },
      { name: "Ms. Aisha Liyana", role: "UI and VR Designer" },
      { name: "Ms. Arpita Leela Thomas", role: "UI and VR Designer" },
      { name: "Ms. Trinetra Sathish", role: "UI and VR Designer" },
      { name: "Ms. Ridhima Maurya", role: "Logo Designer" },
    ],
  },
] as const;

export default function CoreTeam() {
  return (
    <section id="core-team" aria-labelledby="core-team-title" className="scroll-mt-24 bg-cream-dark px-6 py-20 text-ink md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SlideUp>
          <p className="text-[11px] tracking-[0.3em] text-stone uppercase">The People Behind ViswaRoop</p>
          <div className="mt-5 grid gap-6 border-b border-line pb-10 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] md:items-end">
            <h2 id="core-team-title" className="font-display text-4xl leading-tight italic md:text-5xl">Meet the Core Team</h2>
            <p className="max-w-xl text-sm leading-relaxed text-charcoal/75 md:justify-self-end">
              ViswaRoop brings together research, technology, immersive design, and visual identity to make cultural artifacts accessible in virtual space.
            </p>
          </div>
        </SlideUp>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {teamGroups.map((group, groupIndex) => (
            <SlideUp key={group.title} delay={groupIndex * 0.06}>
              <div>
                <h3 className="text-[10px] tracking-label text-stone uppercase">{group.title}</h3>
                <ul className="mt-5 divide-y divide-line border-y border-line">
                  {group.members.map((member) => (
                    <li key={member.name} className="py-5">
                      <p data-no-translate className="font-display text-xl italic">{member.name}</p>
                      <p className="mt-2 text-[10px] tracking-label text-stone uppercase">{member.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}

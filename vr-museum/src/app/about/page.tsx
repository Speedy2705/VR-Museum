import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AboutHero from "@/components/sections/AboutHero";
import StatsBar from "@/components/sections/StatsBar";
import MissionSplit from "@/components/sections/MissionSplit";
import CoreTeam from "@/components/sections/CoreTeam";
import HowItWorks from "@/components/sections/HowItWorks";
import StudioPresets from "@/components/sections/StudioPresets";
import CTASection from "@/components/sections/CTASection";
import { pageImages } from "@/lib/media";
import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/localized-metadata";

export function generateMetadata(): Promise<Metadata> { return localizedMetadata("About", "Learn how ViswaRoop makes historical artifacts accessible in virtual reality."); }

export default function AboutPage() {
  return (
    <>
      <Navbar hasHeroBackground={false} />
      <main>
        <AboutHero />
        <StatsBar />
        <MissionSplit />
        <CoreTeam />
        <HowItWorks />
        <StudioPresets />
        <CTASection
          eyebrow="Ready?"
          titleLines={["Add your artifact to the museum"]}
          image={{
            src: pageImages.vrPerson,
            alt: "Person wearing a VR headset",
            label: "VR person photo",
          }}
          buttons={[
            {
              label: "Upload Artifact →",
              href: "/upload",
              variant: "filled",
            },
            {
              label: "Explore Collections",
              href: "/collections",
              variant: "outline",
            },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}

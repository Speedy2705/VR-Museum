import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { listArtifacts } from "@/server/services/artifact.service";
import { getRequestLocale } from "@/lib/request-locale";
import { getLocalizedArtifact, getLocalizedCollection } from "@/server/services/content-translation.service";
import { mapWithConcurrency } from "@/server/concurrency";
import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/localized-metadata";

export function generateMetadata(): Promise<Metadata> { return localizedMetadata("Immersive Virtual Museum", "Explore cultural artifacts through browser-based spatial galleries, interactive 3D models, contextual plaques, and museum lighting."); }
export default async function VrHomePage() {
  const [rows, locale] = await Promise.all([listArtifacts({}, "en"), getRequestLocale()]);
  const artifacts = await mapWithConcurrency(rows, 8, async (artifact) => ({
    ...await getLocalizedArtifact(artifact, locale),
    collection: await getLocalizedCollection(artifact.collection, locale),
  }));
  return <><Navbar hasHeroBackground /><main className="bg-ink text-white"><section className="relative min-h-[72vh] overflow-hidden"><PlaceholderImage src="/images/hero-gallery.png" alt="Virtual museum gallery" label="Virtual museum" fill priority dark/><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent"/><div className="relative mx-auto flex min-h-[72vh] max-w-6xl items-center px-6 pt-24 md:px-10"><div className="max-w-xl"><p className="text-[10px] tracking-label uppercase text-white/60">Museum Without Walls</p><h1 className="font-display mt-4 text-5xl italic md:text-7xl">Explore Culture in Immersive Space</h1><p className="mt-6 max-w-lg leading-relaxed text-white/70">Choose an artifact to enter a browser-based spatial gallery, read its contextual plaque, inspect available 3D media, and experience lighting designed around its material.</p><a href="#vr-artifacts" className="mt-8 inline-block bg-cream px-7 py-3.5 text-[11px] tracking-label uppercase text-ink">Choose an Artifact</a></div></div></section><section id="vr-artifacts" className="mx-auto max-w-6xl px-6 py-20 md:px-10"><p className="text-[10px] tracking-label uppercase text-white/50">Immersive Galleries</p><h2 className="font-display mt-3 text-4xl italic">Select your destination</h2><div className="mt-10 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-3">{artifacts.map((artifact) => <Link key={artifact.id} href={`/vr/${artifact.slug}`} className="group bg-ink p-4"><div className="relative aspect-[4/3] overflow-hidden"><PlaceholderImage src={artifact.image} alt={artifact.title} label={artifact.title} fill dark/><div className="absolute inset-0 bg-black/10 transition group-hover:bg-transparent"/></div><p data-no-translate className="mt-4 text-[9px] tracking-label uppercase text-white/45">{artifact.collection.title}</p><h3 data-no-translate className="font-display mt-1 text-xl italic">{artifact.title}</h3><p className="mt-3 text-[10px] tracking-label uppercase text-white/60">Enter Gallery →</p></Link>)}</div></section></main><Footer /></>;
}

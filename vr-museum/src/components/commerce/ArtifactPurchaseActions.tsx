"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import SignInPrompt from "@/components/ui/SignInPrompt";
import VrEntryModal from "@/components/ui/VrEntryModal";

type Props = { listingId: string; slug: string; title: string; artist: string; material: string; price: number; image?: string };
export default function ArtifactPurchaseActions(props: Props) {
  const { addItem, isInCart, isAuthenticated } = useCart(); const [prompt, setPrompt] = useState(false); const router = useRouter(); const inCart = isInCart(props.slug);
  function add(buy = false) { if (!isAuthenticated) { setPrompt(true); return; } if (!inCart) addItem({ listingId: props.listingId, slug: props.slug, title: props.title, artist: props.artist, material: props.material, license: "Digital Artifact License", price: props.price, image: props.image }); if (buy) router.push("/cart"); }
  return <><div className="mt-7 grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => add(true)} className="bg-ink px-5 py-3.5 text-xs tracking-label uppercase text-white">Add & Review · ${props.price}</button><button type="button" onClick={() => add(false)} disabled={inCart} className="border border-line px-5 py-3.5 text-xs tracking-label uppercase disabled:bg-cream-dark disabled:text-stone">{inCart ? "In Cart" : "Add to Cart"}</button><VrEntryModal href={`/vr/${props.slug}`} label="Open 3D Gallery" variant="dark" className="w-full px-5"/></div><SignInPrompt open={prompt} onClose={() => setPrompt(false)} title="Sign in to purchase" description="Sign in to buy or add this artifact to your saved cart." returnTo={`/collections`} /></>;
}

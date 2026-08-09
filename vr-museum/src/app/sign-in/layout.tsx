import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/localized-metadata";
export function generateMetadata(): Promise<Metadata> { return localizedMetadata("Sign in", "Sign in to your virtual museum account."); }
export default function Layout({ children }: { children: React.ReactNode }) { return children; }

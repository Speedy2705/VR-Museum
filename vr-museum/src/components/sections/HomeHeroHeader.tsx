"use client";

import { LayoutGroup, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";

const NAVBAR_HEIGHT = 80;
const RETURN_GAP = 16;

export default function HomeHeroHeader({ children }: { children: ReactNode }) {
  const brandAnchorRef = useRef<HTMLDivElement>(null);
  const brandInNavbarRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const [brandInNavbar, setBrandInNavbar] = useState(false);
  const reduceMotion = useReducedMotion();

  const updateBrandPosition = useCallback(() => {
    frameRef.current = null;
    const top = brandAnchorRef.current?.getBoundingClientRect().top;
    if (top === undefined) return;

    const next = brandInNavbarRef.current
      ? top <= NAVBAR_HEIGHT + RETURN_GAP
      : top <= NAVBAR_HEIGHT;

    if (next !== brandInNavbarRef.current) {
      brandInNavbarRef.current = next;
      setBrandInNavbar(next);
    }
  }, []);

  useEffect(() => {
    const scheduleUpdate = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateBrandPosition);
      }
    };

    updateBrandPosition();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [updateBrandPosition]);

  return (
    <LayoutGroup id="home-brand-transition">
      <Navbar hasHeroBackground showBrand={brandInNavbar} sharedBrand={!reduceMotion} />
      <main>
        <Hero
          brandAnchorRef={brandAnchorRef}
          showBrand={!brandInNavbar}
          sharedBrand={!reduceMotion}
        />
        {children}
      </main>
    </LayoutGroup>
  );
}

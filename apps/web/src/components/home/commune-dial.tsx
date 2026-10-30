"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CommuneMap } from "@/components/home/commune-map-loader";
import { CommuneShowcase } from "@/components/home/commune-showcase";
import { useCommune } from "@/components/home/commune-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { COMMUNE_NAMES, COVERAGE_COMMUNES } from "@/lib/communes";
import { COMMUNE_PROFILES } from "@/lib/commune-profiles";

// Test photo (Unsplash). Swap it here for the real one.
const SEA_PHOTO = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=75";
// If the map never reports that it arrived (no tiles, no script), the commune opens anyway after this long.
const OPEN_FALLBACK_MS = 2200;

/**
 * Section opened by a sea banner. Below it, a real map of Gran Concepción: on wide screens it pins while the
 * page scrolls and lights the communes one by one; choosing one (a chip or a pin) stops the tour, prefills the
 * lead forms, flies the map to it and then opens its photo and qualities from the centre like a lens.
 */
export function CommuneDial() {
  const tourRef = useRef<HTMLElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const { commune, setCommune } = useCommune();
  const [pinned, setPinned] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const isWide = useMediaQuery("(min-width: 1024px)");
  const allowsMotion = useMediaQuery("(prefers-reduced-motion: no-preference)");
  const isTouring = isWide && allowsMotion && pinned === null;
  const progress = useScrollProgress(tourRef, isTouring);

  const tourName = COVERAGE_COMMUNES[Math.min(COVERAGE_COMMUNES.length - 1, Math.floor(progress * COVERAGE_COMMUNES.length))].name;
  const highlighted = pinned ?? (isTouring ? tourName : null);
  const openedProfile = opened ? COMMUNE_PROFILES[opened] : undefined;

  useEffect(() => {
    if (!pinned) return;
    const timer = window.setTimeout(() => setOpened(pinned), OPEN_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [pinned]);

  function choose(name: string) {
    setOpened(null);
    setPinned(name);
    setCommune(name);
  }

  function close() {
    const closing = opened ?? pinned;
    setOpened(null);
    setPinned(null);
    setCommune("");
    if (closing) requestAnimationFrame(() => chipRefs.current.get(closing)?.focus());
  }

  return (
    <div id="cobertura">
      <div className="relative isolate flex min-h-[16rem] items-end overflow-hidden bg-night sm:min-h-[22rem]">
        <div className="banner-drift absolute -inset-y-[8%] inset-x-0 -z-10">
          <Image src={SEA_PHOTO} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-gradient-to-t from-night/75 to-transparent" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-24">
          <h2 id="coverage-title" className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] text-white">
            Conocemos tu comuna
          </h2>
          <p className="mt-3 max-w-md text-lg text-white/85">Elige la tuya y entra: la dejamos lista en el formulario.</p>
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-10 w-full text-paper sm:h-16"
        >
          <path d="M0 70C180 20 340 10 520 50C700 90 820 40 1000 38C1180 36 1300 70 1440 50V120H0Z" fill="currentColor" />
        </svg>
      </div>

      <section
        ref={tourRef}
        aria-labelledby="coverage-title"
        className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:h-[260vh] lg:px-8 lg:py-0"
      >
        <div className="grid items-center gap-8 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <ul className="flex flex-wrap gap-2">
              {COMMUNE_NAMES.map((name) => {
                const isActive = highlighted === name;
                return (
                  <li key={name}>
                    <button
                      type="button"
                      ref={(button) => {
                        if (button) chipRefs.current.set(name, button);
                        else chipRefs.current.delete(name);
                      }}
                      aria-pressed={pinned === name}
                      onClick={() => choose(name)}
                      className={`h-11 rounded-full border px-4 text-sm font-semibold transition-colors duration-200 ${
                        isActive ? "border-transparent bg-[image:var(--ember)] text-on-accent" : "border-line bg-surface text-ink hover:border-brass"
                      }`}
                    >
                      {name}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div aria-live="polite" className="mt-8 min-h-24 rounded-[1.25rem] border border-line bg-surface p-5 shadow-soft">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">
                {commune || highlighted ? "Comuna" : "Toca una comuna"}
              </p>
              <p className="font-display text-3xl text-ink">{commune || highlighted || " "}</p>
              <a
                href="#cierre"
                className="mt-3 inline-flex min-h-11 items-center border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
              >
                Tasar mi propiedad aquí
              </a>
            </div>
          </div>

          <div className="relative order-first aspect-[4/5] w-full sm:aspect-[4/3] overflow-hidden rounded-[1.75rem] lg:order-none border border-line bg-sand shadow-lift lg:aspect-auto lg:h-full lg:max-h-[40rem]">
            <CommuneMap
              activeName={highlighted}
              pinnedName={pinned}
              reduceMotion={!allowsMotion}
              onSelect={choose}
              onSettled={(name) => setOpened((current) => (pinned === name ? name : current))}
            />
            {opened && openedProfile && (
              <CommuneShowcase
                name={opened}
                profile={openedProfile}
                origin={{ x: 50, y: 50 }}
                names={COMMUNE_NAMES}
                onSelect={choose}
                onClose={close}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

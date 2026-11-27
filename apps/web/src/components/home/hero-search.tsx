"use client";

import { useCommune } from "@/components/home/commune-context";
import { COMMUNE_NAMES } from "@/lib/communes";

const selectClassName =
  "h-12 w-full cursor-pointer appearance-none rounded-none border-0 border-b border-white/70 bg-transparent px-0 pr-8 text-base text-white transition-colors duration-200 hover:border-white focus-visible:border-brass focus-visible:outline-none focus-visible:ring-0 [&>option]:text-ink";

const LABEL = "Revisa Tu Ubicación";

/** The hero search: choosing a commune scrolls to the coverage map with that commune already selected. */
export function HeroSearch() {
  const { commune, setCommune } = useCommune();

  function handleChange(name: string) {
    setCommune(name);
    if (!name) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("mapa-comunas-cuadro")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }

  return (
    <div role="search" aria-label="Buscar proyectos" className="mt-10 max-w-sm">
      <div className="relative">
        <label htmlFor="hero-commune" className="sr-only">
          {LABEL}
        </label>
        <select id="hero-commune" value={commune} onChange={(event) => handleChange(event.target.value)} className={selectClassName}>
          <option value="">{LABEL}</option>
          {COMMUNE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute bottom-3.5 right-0 size-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

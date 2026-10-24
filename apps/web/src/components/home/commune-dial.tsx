"use client";

import { useRef, useState } from "react";
import { useCommune } from "@/components/home/commune-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { COVERAGE_COMMUNES } from "@/lib/communes";

/**
 * Schematic map of Gran Concepción. On wide screens it pins while the page scrolls and lights the
 * communes one by one; choosing one (click or tap) stops the tour and prefills the lead forms.
 */
export function CommuneDial() {
  const sectionRef = useRef<HTMLElement>(null);
  const { commune, setCommune } = useCommune();
  const [pinned, setPinned] = useState<string | null>(null);
  const isWide = useMediaQuery("(min-width: 1024px)");
  const allowsMotion = useMediaQuery("(prefers-reduced-motion: no-preference)");
  const isTouring = isWide && allowsMotion && pinned === null;
  const progress = useScrollProgress(sectionRef, isTouring);

  const tourName = COVERAGE_COMMUNES[Math.min(COVERAGE_COMMUNES.length - 1, Math.floor(progress * COVERAGE_COMMUNES.length))].name;
  const highlighted = pinned ?? (isTouring ? tourName : null);

  function choose(name: string) {
    const next = pinned === name ? null : name;
    setPinned(next);
    setCommune(next ?? "");
  }

  return (
    <section
      ref={sectionRef}
      id="cobertura"
      aria-labelledby="coverage-title"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:h-[260vh] lg:px-8 lg:py-0"
    >
      <div className="grid items-center gap-10 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h2
            id="coverage-title"
            className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl"
          >
            Conocemos tu comuna
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Concepción y sus vecinas, calle por calle. Elige la tuya y la dejamos lista en el formulario.
          </p>
          <div aria-live="polite" className="mt-8 min-h-24 rounded-[1.25rem] border border-line bg-surface p-5 shadow-soft">
            <p className="text-sm text-muted">{commune || highlighted ? "Comuna" : "Toca una comuna del mapa"}</p>
            <p className="font-display text-3xl font-semibold text-ink">{commune || highlighted || " "}</p>
            <a
              href="#tasar"
              className="mt-3 inline-block border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
            >
              Tasar mi propiedad aquí
            </a>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-soft lg:max-h-[min(34rem,calc(100vh-8rem))] lg:max-w-none lg:aspect-auto lg:h-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full text-line"
          >
            <path d="M0 0H14C20 14 8 24 14 36C18 46 10 58 16 70C20 80 12 90 14 100H0Z" className="fill-paper" />
            <path
              d="M100 62C86 54 72 58 62 50C54 44 44 46 34 44C28 43 22 44 14 46"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M62 50C58 34 52 26 46 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <ul className="absolute inset-0">
            {COVERAGE_COMMUNES.map((item) => {
              const isActive = highlighted === item.name;
              return (
                <li key={item.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${item.x}%`, top: `${item.y}%` }}>
                  <button
                    type="button"
                    aria-pressed={pinned === item.name}
                    onClick={() => choose(item.name)}
                    className="group flex min-h-11 items-center gap-2 rounded-full px-2 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={`block size-3.5 shrink-0 rounded-full border-2 transition-[transform,background-color] duration-300 ${
                        isActive ? "scale-150 border-brass bg-brass" : "border-ink/50 bg-surface group-hover:border-brass"
                      }`}
                    />
                    <span
                      className={`whitespace-nowrap text-xs font-semibold transition-colors duration-300 sm:text-sm ${
                        isActive ? "text-ink" : "text-muted"
                      }`}
                    >
                      {item.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

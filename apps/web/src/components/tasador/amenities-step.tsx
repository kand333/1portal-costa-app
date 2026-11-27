"use client";

import {
  VALUATION_AMENITIES,
  VALUATION_AMENITY_LABELS,
  type ValuationAmenity,
} from "@portal/shared/valuation";
import { useEffect, useRef } from "react";

/** Simple outline icons, one per amenity (decorative: the label next to each one carries the meaning). */
const amenityIconPaths: Record<ValuationAmenity, string> = {
  pool: "M3 17c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M8 14V6a2 2 0 0 1 4 0M14 14V6a2 2 0 0 1 4 0",
  gym: "M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12",
  concierge: "M4 18h16M6 18a6 6 0 0 1 12 0M12 8V6M10 6h4",
  garden: "M12 21v-8M12 13c0-4-3-6-6-6 0 4 2 6 6 6ZM12 13c0-3 2-5 6-5 0 3-2 5-6 5Z",
  heating: "M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 .3 1.3 1 2 2 2 0-2-1-3 0-6Z",
  storage: "M4 8l8-4 8 4v12H4zM9 20v-6h6v6",
};

type AmenitiesStepProps = {
  selected: readonly ValuationAmenity[];
  onToggle: (amenity: ValuationAmenity) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSending: boolean;
  errorMessage: string;
};

/**
 * Step 2: optional amenities that refine the estimate. Skipping them is fine. On entering, the page scrolls so the
 * options sit in the middle of the screen, and «Estimar precio» stays pinned at the bottom while they are chosen.
 */
export function AmenitiesStep({ selected, onToggle, onBack, onSubmit, isSending, errorMessage }: AmenitiesStepProps) {
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    optionsRef.current?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }, []);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!isSending) onSubmit();
      }}
    >
      <fieldset>
        <legend className="text-xl font-semibold text-ink">Amenidades de la propiedad</legend>
        <p className="mt-1 text-muted">Marca las que tenga para afinar la estimación. Si no tiene ninguna, sigue.</p>
        <div ref={optionsRef} className="mt-6 grid grid-cols-2 gap-3">
          {VALUATION_AMENITIES.map((amenity) => {
            const isChecked = selected.includes(amenity);
            return (
              <label
                key={amenity}
                className="group relative flex min-h-24 cursor-pointer flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-ink transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brass has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:shadow-[0_12px_32px_-20px_rgb(245_105_8/0.6)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-7 text-muted transition-colors duration-200 group-has-[:checked]:text-brass-text"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={amenityIconPaths[amenity]} />
                </svg>
                <span className="font-medium">{VALUATION_AMENITY_LABELS[amenity]}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(amenity)}
                  className="absolute right-3 top-3 size-5 accent-[var(--accent)]"
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      {errorMessage && (
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-4 border-t border-line bg-surface/95 px-4 pr-20 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:mx-0 sm:rounded-b-xl sm:px-0 sm:pr-20 lg:pr-0">
        <button
          type="button"
          onClick={onBack}
          className="h-12 rounded-full border border-line px-6 font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={isSending}
          className="h-12 min-w-44 rounded-full bg-accent px-8 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
        >
          {isSending ? "Calculando…" : "Estimar precio"}
        </button>
      </div>
    </form>
  );
}

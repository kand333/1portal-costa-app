"use client";

import {
  VALUATION_AMENITIES,
  VALUATION_AMENITY_LABELS,
  type ValuationAmenity,
} from "@portal/shared/valuation";
import { useEffect, useRef } from "react";

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
        <div ref={optionsRef} className="mt-6 grid gap-3 sm:grid-cols-2">
          {VALUATION_AMENITIES.map((amenity) => {
            const isChecked = selected.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-ink transition-colors duration-200 hover:border-brass has-[:checked]:border-accent has-[:checked]:bg-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass/60"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(amenity)}
                  className="size-4 accent-[var(--accent)]"
                />
                {VALUATION_AMENITY_LABELS[amenity]}
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

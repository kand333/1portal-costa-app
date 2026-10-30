"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { COMMUNE_NAMES } from "@/lib/communes";
import { propertyTypeLabels } from "@/lib/property-format";
import { buildPropertySearchHref } from "@/lib/property-search";

const selectClassName =
  "h-12 w-full cursor-pointer appearance-none rounded-none border-0 border-b border-white/70 bg-transparent px-0 pr-8 text-base text-white transition-colors duration-200 hover:border-white focus-visible:border-brass focus-visible:outline-none focus-visible:ring-0 [&>option]:text-ink";

const chevron = (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute bottom-3.5 right-0 size-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

type HeroSearchProps = {
  /** Published properties, shown as «Se han encontrado N resultados». Omitted when unknown. */
  resultCount: number | null;
};

/** The hero search: a commune and a property type, like the reference, and a way to the full catalog. */
export function HeroSearch({ resultCount }: HeroSearchProps) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Without JavaScript the native GET submission to /properties still works.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    router.push(buildPropertySearchHref({ search: String(formData.get("search") ?? ""), type: String(formData.get("type") ?? "") }));
  }

  return (
    <form action="/properties" method="get" role="search" aria-label="Buscar proyectos" onSubmit={handleSubmit} className="mt-10 max-w-3xl">
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        <div className="relative">
          <label htmlFor="hero-commune" className="sr-only">
            Comuna
          </label>
          <select id="hero-commune" name="search" defaultValue="" className={selectClassName}>
            <option value="">Comuna</option>
            {COMMUNE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {chevron}
        </div>
        <div className="relative">
          <label htmlFor="hero-type" className="sr-only">
            Tipo de propiedad
          </label>
          <select id="hero-type" name="type" defaultValue="" className={selectClassName}>
            <option value="">Tipo de propiedad</option>
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {chevron}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
        <button
          type="submit"
          className="inline-flex h-14 items-center bg-white px-9 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition-transform duration-200 hover:-translate-y-0.5"
        >
          Ver resultados
        </button>
        <Link
          href="/properties"
          className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.18em] text-white underline-offset-8 transition-opacity duration-200 hover:underline"
        >
          Búsqueda avanzada
        </Link>
      </div>
      {resultCount !== null && (
        <p className="mt-4 text-sm text-white/85">
          Se {resultCount === 1 ? "ha encontrado 1 resultado" : `han encontrado ${resultCount} resultados`}
        </p>
      )}
    </form>
  );
}

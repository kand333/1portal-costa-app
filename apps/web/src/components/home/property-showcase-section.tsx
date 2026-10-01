"use client";

import Link from "next/link";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyCardSkeleton } from "@/components/properties/property-card-skeleton";
import { useProperties, type PropertiesQuery } from "@/hooks/use-properties";

type PropertyShowcaseSectionProps = {
  id: string;
  title: string;
  description: string;
  query: PropertiesQuery & { pageSize: number };
  viewAllHref: string;
  viewAllLabel: string;
};

const gridClassName = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function PropertyShowcaseSection({
  id,
  title,
  description,
  query,
  viewAllHref,
  viewAllLabel,
}: PropertyShowcaseSectionProps) {
  const { data, error, isLoading, mutate } = useProperties(query);
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId} className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={titleId} className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
        <Link
          href={viewAllHref}
          className="rounded-md text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:text-sky-400"
        >
          {viewAllLabel} <span aria-hidden="true">→</span>
        </Link>
      </div>

      {isLoading && (
        <div className={gridClassName} role="status" aria-label={`Cargando ${title.toLowerCase()}`}>
          {Array.from({ length: query.pageSize }, (_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p>No pudimos cargar las propiedades. {error.message}</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Reintentar
          </button>
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Aún no hay propiedades disponibles en esta sección.
        </p>
      )}

      {data && data.data.length > 0 && (
        <ul className={gridClassName}>
          {data.data.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { PropertyResults } from "@/components/properties/property-results";
import { useProperties, type PropertiesQuery } from "@/hooks/use-properties";

type PropertyShowcaseSectionProps = {
  id: string;
  title: string;
  description: string;
  query: PropertiesQuery & { pageSize: number };
  viewAllHref: string;
  viewAllLabel: string;
};

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

      <PropertyResults
        data={data}
        error={error}
        isLoading={isLoading}
        onRetry={() => mutate()}
        skeletonCount={query.pageSize}
        loadingLabel={`Cargando ${title.toLowerCase()}`}
        emptyMessage="Aún no hay propiedades disponibles en esta sección."
      />
    </section>
  );
}

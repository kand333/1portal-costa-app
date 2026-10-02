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
    <section id={id} aria-labelledby={titleId} className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 first-of-type:pt-24">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={titleId} className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-muted">{description}</p>
        </div>
        <Link
          href={viewAllHref}
          className="w-fit border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
        >
          {viewAllLabel}
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

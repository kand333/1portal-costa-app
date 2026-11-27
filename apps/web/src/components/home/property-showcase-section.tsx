"use client";

import Link from "next/link";
import { AccentWord } from "@/components/ui/accent-word";
import { PropertyResults } from "@/components/properties/property-results";
import { useProperties, type PropertiesQuery } from "@/hooks/use-properties";

type PropertyShowcaseSectionProps = {
  id: string;
  title: string;
  description: string;
  query: PropertiesQuery & { pageSize: number };
  viewAllHref: string;
  viewAllLabel: string;
  /** Sets the last word of the title as the orange italic accent (the landing's headline style). */
  accentLastWord?: boolean;
};

export function PropertyShowcaseSection({
  id,
  title,
  description,
  query,
  viewAllHref,
  viewAllLabel,
  accentLastWord = false,
}: PropertyShowcaseSectionProps) {
  const { data, error, isLoading, mutate } = useProperties(query);
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId} className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id={titleId}
            className={`font-display text-4xl tracking-tight text-ink sm:text-5xl ${accentLastWord ? "display-heavy" : "font-semibold"}`}
          >
            {accentLastWord && title.includes(" ") ? (
              <>
                {title.slice(0, title.lastIndexOf(" ") + 1)}
                <AccentWord>{title.slice(title.lastIndexOf(" ") + 1)}</AccentWord>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mt-2 max-w-xl text-muted">{description}</p>
        </div>
        <Link
          href={viewAllHref}
          className="inline-flex min-h-11 w-fit items-center border-b border-brass pb-0.5 text-sm font-semibold text-brass-text transition-colors duration-200 hover:border-ink"
        >
          {viewAllLabel}
        </Link>
      </div>

      <PropertyResults
        data={data}
        error={error}
        // SWR does not count the server-loaded fallback as "loaded", so isLoading stays true until it revalidates.
        isLoading={isLoading && data === undefined}
        onRetry={() => mutate()}
        skeletonCount={query.pageSize}
        layout="wide"
        loadingLabel={`Cargando ${title.toLowerCase()}`}
        emptyMessage="Aún no hay propiedades disponibles en esta sección."
      />
    </section>
  );
}

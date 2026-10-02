"use client";

import { DEFAULT_PAGE_SIZE } from "@portal/shared/limits";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useProperties } from "@/hooks/use-properties";
import { countActiveFilters, parseCatalogFilters } from "@/lib/catalog-filters";
import { parseSortParam } from "@/lib/catalog-sort";
import { parsePageParam } from "@/lib/pagination";
import { parseSearchParam } from "@/lib/property-search";
import { CatalogFiltersPanel } from "./catalog-filters-panel";
import { CatalogSearchForm } from "./catalog-search-form";
import { CatalogSortSelect } from "./catalog-sort-select";
import { Pagination } from "./pagination";
import { PropertyResults } from "./property-results";

/** Public catalog: published properties from the REST API. Page, search and filters live in the URL. */
export function PropertyCatalog() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedPage = parsePageParam(searchParams.get("page"));
  const search = parseSearchParam(searchParams.get("search"));
  const filters = parseCatalogFilters(new URLSearchParams(searchParams.toString()));
  const hasFilters = countActiveFilters(filters) > 0;
  const sort = parseSortParam(searchParams.get("sort"));

  // Filters start open next to the results on large screens and folded on small ones, until the
  // user toggles them.
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [filtersOpenChoice, setFiltersOpenChoice] = useState<boolean | null>(null);
  const areFiltersOpen = filtersOpenChoice ?? isLargeScreen;

  const { data, error, isLoading, isValidating, mutate } = useProperties({
    ...filters,
    page: requestedPage,
    pageSize: DEFAULT_PAGE_SIZE,
    search,
    sort,
  });
  // SWR counts previous results as "not loaded", so `isLoading` is also true while a new page, filter
  // or order loads. Placeholders are for the very first load only; afterwards the previous results
  // stay on screen (dimmed) until the new ones arrive.
  const isFirstLoad = isLoading && data === undefined;
  const isRefreshing = isValidating && data !== undefined;

  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;
  // A page beyond the last one (e.g. an old link) returns no items although properties match.
  const isPageOutOfRange = data !== undefined && data.data.length === 0 && total > 0;

  let emptyMessage = "Aún no hay propiedades publicadas.";
  if (isPageOutOfRange) emptyMessage = "Esta página no existe. Elige otra página del catálogo.";
  else if (hasFilters)
    emptyMessage = `No encontramos propiedades con estos filtros${search ? ` para «${search}»` : ""}. Prueba quitando alguno.`;
  else if (search) emptyMessage = `No encontramos propiedades que coincidan con «${search}». Prueba con otras palabras.`;

  return (
    <div className={areFiltersOpen ? "lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-10" : undefined}>
      {/* When open on large screens: sticky and scrollable, since the panel may be taller than the screen. */}
      <aside
        aria-label="Filtros"
        className={
          areFiltersOpen ? "mb-6 lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto" : "mb-2"
        }
      >
        <CatalogFiltersPanel
          filters={filters}
          isOpen={areFiltersOpen}
          onToggle={() => setFiltersOpenChoice(!areFiltersOpen)}
          closeAfterApply={!isLargeScreen}
        />
      </aside>

      <div>
        <CatalogSearchForm search={search} />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="min-h-6 text-muted tabular-nums">
            {data && total > 0 && !isPageOutOfRange && (
              <>
                {total} {total === 1 ? "propiedad" : "propiedades"}
                {search && ` para «${search}»`}
                {hasFilters && " con los filtros aplicados"}
                {totalPages > 1 && ` · Página ${requestedPage} de ${totalPages}`}
              </>
            )}
          </p>
          {/* Nothing to sort when no property matches. */}
          {!(data && total === 0) && <CatalogSortSelect sort={sort} />}
        </div>

        {/* Dimmed (not replaced by placeholders) while new results load, so the list does not flash. */}
        <div
          aria-busy={isRefreshing}
          className={isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"}
        >
          <PropertyResults
            data={data}
            error={error}
            isLoading={isFirstLoad}
            onRetry={() => mutate()}
            skeletonCount={DEFAULT_PAGE_SIZE}
            loadingLabel="Cargando propiedades"
            emptyMessage={emptyMessage}
            layout={areFiltersOpen ? "withSidebar" : "full"}
          />

          {data && (
            <Pagination
              pathname={pathname}
              searchParams={new URLSearchParams(searchParams.toString())}
              currentPage={requestedPage}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
}

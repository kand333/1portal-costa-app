"use client";

import { DEFAULT_PROPERTY_SORT, PROPERTY_SORTS, type PropertySort } from "@portal/shared/enums";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { buildCatalogSortHref } from "@/lib/catalog-sort";
import { sortLabels } from "@/lib/property-format";

type CatalogSortSelectProps = {
  /** Active sort order, read from the URL. */
  sort: PropertySort | undefined;
};

/** Sort order of the catalog. It lives in the URL (`?sort=`) and applies as soon as it changes. */
export function CatalogSortSelect({ sort }: CatalogSortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    router.push(
      buildCatalogSortHref(pathname, new URLSearchParams(searchParams.toString()), event.target.value as PropertySort),
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="catalog-sort" className="text-sm font-medium text-muted">
        Ordenar por
      </label>
      <select
        id="catalog-sort"
        value={sort ?? DEFAULT_PROPERTY_SORT}
        onChange={handleChange}
        className="h-11 rounded-full border border-line bg-surface px-4 text-sm text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
      >
        {PROPERTY_SORTS.map((option) => (
          <option key={option} value={option}>
            {sortLabels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

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
      <label htmlFor="catalog-sort" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Ordenar por
      </label>
      <select
        id="catalog-sort"
        value={sort ?? DEFAULT_PROPERTY_SORT}
        onChange={handleChange}
        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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

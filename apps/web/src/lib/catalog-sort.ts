import { DEFAULT_PROPERTY_SORT, PROPERTY_SORTS, type PropertySort } from "@portal/shared/enums";

/** Reads the `sort` query parameter; an unknown value is ignored (the default order applies). */
export function parseSortParam(value: string | null): PropertySort | undefined {
  return (PROPERTY_SORTS as readonly string[]).includes(value ?? "") ? (value as PropertySort) : undefined;
}

/**
 * Catalog URL with the given sort order, keeping the other parameters. The default order is left
 * out to keep URLs clean, and the page is dropped because the results change.
 */
export function buildCatalogSortHref(pathname: string, searchParams: URLSearchParams, sort: PropertySort): string {
  const nextSearchParams = new URLSearchParams(searchParams);
  nextSearchParams.delete("page");
  if (sort === DEFAULT_PROPERTY_SORT) nextSearchParams.delete("sort");
  else nextSearchParams.set("sort", sort);
  const queryString = nextSearchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

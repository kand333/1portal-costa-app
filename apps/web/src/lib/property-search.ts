import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";

/** Fields of the public property search form. */
export type PropertySearchValues = {
  search?: string;
  operation?: string;
  type?: string;
};

/** Builds the catalog URL for a search, omitting empty values to keep URLs clean. */
export function buildPropertySearchHref(values: PropertySearchValues): string {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    const trimmedValue = value?.trim();
    if (trimmedValue) searchParams.set(name, trimmedValue);
  }
  const queryString = searchParams.toString();
  return queryString ? `/properties?${queryString}` : "/properties";
}

/** Builds the public REST URL for a list of properties. */
export function buildPropertiesApiUrl(
  query: Record<string, string | number | boolean | string[] | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    // Lists become repeated parameters (`commune=a&commune=b`).
    for (const item of value === undefined ? [] : [value].flat()) searchParams.append(name, String(item));
  }
  const queryString = searchParams.toString();
  return queryString ? `/api/properties?${queryString}` : "/api/properties";
}

/**
 * Reads the `search` query parameter for the catalog: trimmed, empty means no search,
 * and cut to the maximum length the API accepts so an edited URL never causes a 400.
 */
export function parseSearchParam(value: string | null): string | undefined {
  const search = value?.trim().slice(0, MAX_SEARCH_LENGTH).trim();
  return search ? search : undefined;
}

/**
 * Builds the catalog URL for a new search keeping the other parameters (filters, sort).
 * The page is dropped because the old page number makes no sense for new results.
 */
export function buildCatalogSearchHref(pathname: string, searchParams: URLSearchParams, search: string): string {
  const nextSearchParams = new URLSearchParams(searchParams);
  nextSearchParams.delete("page");
  const trimmedSearch = search.trim();
  if (trimmedSearch) nextSearchParams.set("search", trimmedSearch);
  else nextSearchParams.delete("search");
  const queryString = nextSearchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

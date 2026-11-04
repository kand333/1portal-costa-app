import { DEFAULT_PAGE_SIZE } from "@portal/shared/limits";
import { parseCatalogFilters, withDefaultRegion } from "./catalog-filters";
import { parseSortParam } from "./catalog-sort";
import { parsePageParam } from "./pagination";
import { parseSearchParam } from "./property-search";

/**
 * The API query for a catalog URL. The browser (`PropertyCatalog`) and the server (`/properties`) both build it here,
 * so the server-rendered results and the SWR cache key of the first render are the same.
 */
export function buildCatalogQuery(searchParams: URLSearchParams) {
  return {
    ...withDefaultRegion(parseCatalogFilters(searchParams)),
    page: parsePageParam(searchParams.get("page")),
    pageSize: DEFAULT_PAGE_SIZE,
    search: parseSearchParam(searchParams.get("search")),
    sort: parseSortParam(searchParams.get("sort")),
  };
}

/** Next's `searchParams` object as `URLSearchParams` (repeated parameters stay repeated). */
export function toUrlSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(raw)) {
    for (const item of value === undefined ? [] : [value].flat()) searchParams.append(name, item);
  }
  return searchParams;
}

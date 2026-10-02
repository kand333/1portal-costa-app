import {
  OPERATION_TYPES,
  PROPERTY_TYPES,
  type OperationType,
  type PropertyType,
} from "@portal/shared/enums";
import {
  LOCATION_SLUG_PATTERN,
  MAX_FILTER_AMOUNT,
  MAX_LOCATION_SLUG_LENGTH,
  MAX_LOCATIONS_PER_FILTER,
  MAX_ROOMS_FILTER,
} from "@portal/shared/limits";

/** Catalog filters as they live in the URL (same names as the REST query parameters). */
export type CatalogFilters = {
  operation?: OperationType;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minUsableArea?: number;
  /** Location slugs; several values mean "any of them" (repeated parameters in the URL). */
  region?: string[];
  city?: string[];
  commune?: string[];
};

export const CATALOG_FILTER_NAMES = [
  "operation",
  "type",
  "minPrice",
  "maxPrice",
  "bedrooms",
  "bathrooms",
  "minUsableArea",
  "region",
  "city",
  "commune",
] as const satisfies readonly (keyof CatalogFilters)[];

export const LOCATION_FILTER_NAMES = ["region", "city", "commune"] as const satisfies readonly (keyof CatalogFilters)[];

const isOneOf = <Value extends string>(values: readonly Value[], value: string): value is Value =>
  (values as readonly string[]).includes(value);

function parseAmount(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= MAX_FILTER_AMOUNT ? amount : undefined;
}

function parseRooms(value: string | null): number | undefined {
  const rooms = parseAmount(value);
  return rooms !== undefined && Number.isInteger(rooms) && rooms >= 1 && rooms <= MAX_ROOMS_FILTER ? rooms : undefined;
}

/** Valid, distinct slugs of a repeated parameter (invalid ones are dropped, the rest kept). */
function parseSlugs(values: string[]): string[] | undefined {
  const slugs = values
    .map((value) => value.trim().toLowerCase())
    .filter((slug) => slug.length <= MAX_LOCATION_SLUG_LENGTH && LOCATION_SLUG_PATTERN.test(slug));
  const distinctSlugs = [...new Set(slugs)].slice(0, MAX_LOCATIONS_PER_FILTER);
  return distinctSlugs.length > 0 ? distinctSlugs : undefined;
}

/**
 * Reads the filters from the URL. It is lenient on purpose: an invalid or edited value is ignored
 * instead of breaking the catalog (the API would answer 400 to it).
 */
export function parseCatalogFilters(searchParams: URLSearchParams): CatalogFilters {
  const operation = searchParams.get("operation") ?? "";
  const type = searchParams.get("type") ?? "";
  let minPrice = parseAmount(searchParams.get("minPrice"));
  let maxPrice = parseAmount(searchParams.get("maxPrice"));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    // Contradictory range: drop it rather than showing an empty catalog.
    minPrice = undefined;
    maxPrice = undefined;
  }

  const filters: CatalogFilters = {
    operation: isOneOf(OPERATION_TYPES, operation) ? operation : undefined,
    type: isOneOf(PROPERTY_TYPES, type) ? type : undefined,
    minPrice,
    maxPrice,
    bedrooms: parseRooms(searchParams.get("bedrooms")),
    bathrooms: parseRooms(searchParams.get("bathrooms")),
    minUsableArea: parseAmount(searchParams.get("minUsableArea")),
    region: parseSlugs(searchParams.getAll("region")),
    city: parseSlugs(searchParams.getAll("city")),
    commune: parseSlugs(searchParams.getAll("commune")),
  };
  // Omit unused filters so the object only describes what is active.
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined)) as CatalogFilters;
}

/** Number of active choices: each selected location counts (2 communes = 2). */
export function countActiveFilters(filters: CatalogFilters): number {
  return CATALOG_FILTER_NAMES.reduce((count, filterName) => {
    const value = filters[filterName];
    if (value === undefined) return count;
    return count + (Array.isArray(value) ? value.length : 1);
  }, 0);
}

/**
 * Catalog URL with the given filters, replacing the previous ones and keeping the other parameters
 * (search). The page is dropped because the results change.
 */
export function buildCatalogFiltersHref(pathname: string, searchParams: URLSearchParams, filters: CatalogFilters): string {
  const nextSearchParams = new URLSearchParams(searchParams);
  nextSearchParams.delete("page");
  for (const filterName of CATALOG_FILTER_NAMES) {
    nextSearchParams.delete(filterName);
    const value = filters[filterName];
    for (const item of value === undefined ? [] : [value].flat()) {
      nextSearchParams.append(filterName, String(item));
    }
  }
  const queryString = nextSearchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

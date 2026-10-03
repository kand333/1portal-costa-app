import { ADMIN_PROPERTY_STATUSES, type AdminPropertyStatus } from "@portal/shared/admin-property";
import { OPERATION_TYPES, PROPERTY_TYPES, type OperationType, type PropertyType } from "@portal/shared/enums";
import { LOCATION_SLUG_PATTERN, MAX_FILTER_AMOUNT, MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { parsePageParam } from "./pagination";

export const ADMIN_PROPERTIES_PATH = "/admin/properties";

/** Filters of the admin property list; absent means not used (status: active). */
export type AdminPropertyFilterParams = {
  status: AdminPropertyStatus;
  operation?: OperationType;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  /** City slug, as in the public catalog. */
  city?: string;
  /** Creation days, YYYY-MM-DD. */
  createdFrom?: string;
  createdTo?: string;
};

export type AdminPropertyListParams = AdminPropertyFilterParams & { page: number; search: string };

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => {
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text : undefined;
};
const oneOf = <Value extends string>(values: readonly Value[], text: string | undefined) =>
  values.find((value) => value === text);
const amount = (text: string | undefined) => {
  const value = text === undefined ? NaN : Number(text);
  return Number.isFinite(value) && value >= 0 && value <= MAX_FILTER_AMOUNT ? value : undefined;
};
const day = (text: string | undefined) =>
  text && /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? text : undefined;

/**
 * Reads the list state from the URL. Invalid values are dropped, and so is a reversed range (the
 * API would reject it), so a hand-edited URL never breaks the page.
 */
export function parseAdminPropertyListParams(searchParams: PageSearchParams): AdminPropertyListParams {
  const value = (name: string) => firstValue(searchParams[name]);
  const city = value("city")?.toLowerCase();
  const params: AdminPropertyListParams = {
    page: parsePageParam(value("page") ?? null),
    search: (value("search") ?? "").slice(0, MAX_SEARCH_LENGTH),
    status: oneOf(ADMIN_PROPERTY_STATUSES, value("status")) ?? "active",
    operation: oneOf(OPERATION_TYPES, value("operation")),
    type: oneOf(PROPERTY_TYPES, value("type")),
    minPrice: amount(value("minPrice")),
    maxPrice: amount(value("maxPrice")),
    city: city && LOCATION_SLUG_PATTERN.test(city) ? city : undefined,
    createdFrom: day(value("createdFrom")),
    createdTo: day(value("createdTo")),
  };
  if (params.minPrice !== undefined && params.maxPrice !== undefined && params.minPrice > params.maxPrice) {
    params.maxPrice = undefined;
  }
  if (params.createdFrom && params.createdTo && params.createdFrom > params.createdTo) params.createdTo = undefined;
  return params;
}

/** The same state as a query string, without the defaults (shared by the page URL and the API call). */
export function toAdminPropertyListQuery(params: AdminPropertyListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (params.status !== "active") query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  for (const name of ["operation", "type", "minPrice", "maxPrice", "city", "createdFrom", "createdTo"] as const) {
    const value = params[name];
    if (value !== undefined) query.set(name, String(value));
  }
  if (params.page > 1) query.set("page", String(params.page));
  return query;
}

/** How many filters (besides the search) are in use: shown on the collapsed panel. */
export function countActiveFilters(params: AdminPropertyFilterParams): number {
  const { status, operation, type, minPrice, maxPrice, city, createdFrom, createdTo } = params;
  return [status !== "active", operation, type, minPrice ?? maxPrice, city, createdFrom ?? createdTo].filter(
    (value) => value !== undefined && value !== false,
  ).length;
}

/** REST path of the admin property list. */
export function buildAdminPropertiesApiPath(params: AdminPropertyListParams): string {
  const query = toAdminPropertyListQuery(params).toString();
  return query ? `/api/admin/properties?${query}` : "/api/admin/properties";
}

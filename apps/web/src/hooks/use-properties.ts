"use client";

import type { PropertySort } from "@portal/shared/enums";
import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import useSWR from "swr";
import { fetchJson } from "@/lib/api-client";
import type { CatalogFilters } from "@/lib/catalog-filters";
import { buildPropertiesApiUrl } from "@/lib/property-search";

export type PropertiesQuery = CatalogFilters & {
  page?: number;
  pageSize?: number;
  featured?: boolean;
  search?: string;
  sort?: PropertySort;
};

/**
 * Loads published properties from the public REST API (cached and deduplicated by SWR).
 * While a new query loads (another page, filter or order) the previous results stay available, so
 * the list can be dimmed instead of being replaced by placeholders.
 */
export function useProperties(query: PropertiesQuery) {
  return useSWR<PaginatedResponse<PropertySummary>, Error>(buildPropertiesApiUrl(query), fetchJson, {
    keepPreviousData: true,
  });
}

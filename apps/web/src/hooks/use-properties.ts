"use client";

import useSWR from "swr";
import { fetchJson } from "@/lib/api-client";
import { buildPropertiesApiUrl } from "@/lib/property-search";
import type { OperationType } from "@portal/shared/enums";
import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";

export type PropertiesQuery = {
  page?: number;
  pageSize?: number;
  operation?: OperationType;
  featured?: boolean;
};

/** Loads published properties from the public REST API (cached and deduplicated by SWR). */
export function useProperties(query: PropertiesQuery) {
  return useSWR<PaginatedResponse<PropertySummary>, Error>(buildPropertiesApiUrl(query), fetchJson);
}

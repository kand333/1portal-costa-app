"use client";

import type { PropertyFilterOptions } from "@portal/shared/property";
import useSWR from "swr";
import { fetchJson } from "@/lib/api-client";

/** Regions, cities and communes that have published properties, for the catalog filters. */
export function useFilterOptions() {
  return useSWR<PropertyFilterOptions, Error>("/api/properties/filter-options", fetchJson, {
    // The list barely changes while browsing; avoid refetching it on every focus.
    revalidateOnFocus: false,
  });
}

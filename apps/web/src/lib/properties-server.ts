import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import { apiInternalUrl } from "./api-internal-url";
import { buildPropertiesApiUrl } from "./property-search";

/** Property lists keyed by their `/api/properties?...` URL: the cache keys `useProperties` (SWR) reads. */
export type PropertiesFallback = Record<string, PaginatedResponse<PropertySummary>>;

type PropertiesQuery = Record<string, string | number | boolean | string[] | undefined>;

/**
 * Loads property lists on the server so their cards are in the first HTML (search engines and slow clients see them
 * without running JavaScript). A list the API cannot answer is left out: the browser fetches it as before.
 */
export async function fetchPropertiesFallback(queries: readonly PropertiesQuery[]): Promise<PropertiesFallback> {
  const entries = await Promise.all(
    queries.map(async (query) => {
      const key = buildPropertiesApiUrl(query);
      try {
        const response = await fetch(`${apiInternalUrl()}${key}`, {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 },
        });
        if (!response.ok) return null;
        return [key, (await response.json()) as PaginatedResponse<PropertySummary>] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}

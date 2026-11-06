import { fetchPublishedCountWhere } from "./published-count";
import type { ValuationLanding } from "./valuation-landing";

/** Published properties of the landing's type in its commune, or null when the API cannot answer. */
export function countLandingProperties(landing: ValuationLanding): Promise<number | null> {
  return fetchPublishedCountWhere({ city: [landing.commune.citySlug], type: landing.propertyType });
}

/**
 * A landing is worth indexing only when the portal shows real properties for it. With none, the page would be a
 * near copy of its siblings, so it is noindex and out of the sitemap. An unknown count (API down) keeps it indexable.
 */
export function isLandingIndexable(count: number | null): boolean {
  return count !== 0;
}

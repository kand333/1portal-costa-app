import { MAX_PAGE_SIZE } from "@portal/shared/limits";
import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import type { MetadataRoute } from "next";
import { apiInternalUrl } from "./api-internal-url";
import { siteUrl } from "./site-url";
import { listValuationLandings } from "./valuation-landing";

const STATIC_PATHS: readonly string[] = [
  "/",
  "/properties",
  "/tasador-propiedades",
  ...listValuationLandings().map((landing) => landing.path),
];

/** Safety stop: 20 pages of 50 properties. */
const MAX_PAGES = 20;

async function fetchPublishedPage(page: number): Promise<PaginatedResponse<PropertySummary> | null> {
  try {
    const response = await fetch(`${apiInternalUrl()}/api/properties?pageSize=${MAX_PAGE_SIZE}&page=${page}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as PaginatedResponse<PropertySummary>;
  } catch {
    return null;
  }
}

/** Public pages plus every published property. If the API cannot answer, only the fixed pages are listed. */
export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({ url: `${origin}${path === "/" ? "" : path}` }));

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchPublishedPage(page);
    if (!result) break;
    for (const property of result.data) {
      entries.push({ url: `${origin}/properties/${property.id}`, lastModified: property.createdAt });
    }
    if (page >= result.meta.totalPages) break;
  }
  return entries;
}

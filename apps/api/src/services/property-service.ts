import "server-only";
import { ApiError } from "@/lib/http/api-error";
import { normalizeSearchText } from "@/lib/normalize-search-text";
import { toSlug } from "@/lib/slug";
import {
  findPublishedLocations,
  findPublishedProperties,
  findPublishedPropertyById,
  type PropertyDetailRecord,
  type PropertySummaryRecord,
} from "@/repositories/property-repository";
import type { PropertyListQuery } from "@portal/shared/property-query";
import type {
  LocationOption,
  PaginatedResponse,
  PropertyDetail,
  PropertyFilterOptions,
  PropertySummary,
} from "@portal/shared/property";

type DecimalLike = { toNumber(): number };

const toNullableNumber = (value: DecimalLike | null) => (value === null ? null : value.toNumber());

export function toPropertySummary(record: PropertySummaryRecord): PropertySummary {
  const { images, price, usableArea, totalArea, createdAt, ...fields } = record;
  return {
    ...fields,
    price: price.toNumber(),
    usableArea: toNullableNumber(usableArea),
    totalArea: toNullableNumber(totalArea),
    mainImageUrl: images[0]?.url ?? null,
    createdAt: createdAt.toISOString(),
  };
}

export function toPropertyDetail(record: PropertyDetailRecord): PropertyDetail {
  const { images, features, price, usableArea, totalArea, createdAt, updatedAt, ...fields } = record;
  return {
    ...fields,
    price: price.toNumber(),
    usableArea: toNullableNumber(usableArea),
    totalArea: toNullableNumber(totalArea),
    features: features.map((link) => link.feature.name),
    images,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

const MAX_SEARCH_TERMS = 5;

/**
 * Splits the search text into distinct, normalized words (lowercase, no accents) matching the
 * normalized `searchText` column; extra words beyond the limit are ignored.
 */
export function splitSearchTerms(search: string | undefined): string[] {
  if (!search) return [];
  const words = search.split(/\s+/).filter(Boolean);
  return [...new Set(words.map(normalizeSearchText))].slice(0, MAX_SEARCH_TERMS);
}

/**
 * Location names whose slug is one of the requested ones, so "nunoa" accepts "Ñuñoa" (and any other
 * spelling with the same slug). No match gives an empty list, which yields no results.
 */
export function namesMatchingSlugs(names: string[], slugs: string[] | undefined): string[] | undefined {
  if (slugs === undefined) return undefined;
  const requested = new Set(slugs);
  return names.filter((name) => requested.has(toSlug(name)));
}

export async function listPublishedProperties({
  page,
  pageSize,
  operation,
  featured,
  search,
  sort,
  type,
  minPrice,
  maxPrice,
  bedrooms,
  bathrooms,
  minUsableArea,
  commune,
  city,
  region,
}: PropertyListQuery): Promise<PaginatedResponse<PropertySummary>> {
  const hasLocationFilter = commune !== undefined || city !== undefined || region !== undefined;
  const locations = hasLocationFilter ? await findPublishedLocations() : undefined;

  const { records, total } = await findPublishedProperties(
    {
      operationType: operation,
      propertyType: type,
      isFeatured: featured,
      minPrice,
      maxPrice,
      minBedrooms: bedrooms,
      minBathrooms: bathrooms,
      minUsableArea,
      communes: namesMatchingSlugs(locations?.communes ?? [], commune),
      cities: namesMatchingSlugs(locations?.cities ?? [], city),
      regions: namesMatchingSlugs(locations?.regions ?? [], region),
      searchTerms: splitSearchTerms(search),
    },
    { skip: (page - 1) * pageSize, take: pageSize },
    sort,
  );
  return {
    data: records.map(toPropertySummary),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/** Characters that lose a diacritic when normalized ("Ñuñoa" has 2, "NUNOA" has 0); case is ignored. */
const countAccentedCharacters = (name: string) =>
  [...name].filter((character) => normalizeSearchText(character) !== character.toLowerCase()).length;

/**
 * One option per slug, sorted alphabetically in Spanish. Spellings sharing a slug ("NUNOA", "Ñuñoa")
 * collapse into one option that shows the accented spelling, which is the correct one in Spanish.
 */
export function toLocationOptions(names: string[]): LocationOption[] {
  const nameBySlug = new Map<string, string>();
  for (const name of names) {
    const slug = toSlug(name);
    const current = nameBySlug.get(slug);
    if (!slug) continue;
    const isBetterName =
      current === undefined ||
      countAccentedCharacters(name) > countAccentedCharacters(current) ||
      (countAccentedCharacters(name) === countAccentedCharacters(current) && name.localeCompare(current, "es") < 0);
    if (isBetterName) nameBySlug.set(slug, name);
  }
  return [...nameBySlug]
    .map(([slug, name]) => ({ slug, name }))
    .sort((first, second) => first.name.localeCompare(second.name, "es"));
}

/** Locations available for the catalog filters (only those with published properties). */
export async function getPropertyFilterOptions(): Promise<PropertyFilterOptions> {
  const { communes, cities, regions } = await findPublishedLocations();
  return {
    regions: toLocationOptions(regions),
    cities: toLocationOptions(cities),
    communes: toLocationOptions(communes),
  };
}

/** Unpublished properties are reported as not found so drafts are never exposed. */
export async function getPublishedPropertyDetail(id: string): Promise<PropertyDetail> {
  const record = await findPublishedPropertyById(id);
  if (!record) {
    throw new ApiError(404, "Propiedad no encontrada");
  }
  return toPropertyDetail(record);
}

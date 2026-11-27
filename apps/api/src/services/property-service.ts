import "server-only";
import { ApiError } from "@/lib/http/api-error";
import { normalizeSearchText } from "@/lib/normalize-search-text";
import { toSlug } from "@/lib/slug";
import { listValuationCities } from "@/repositories/valuation-sector-repository";
import { detectSector, type NamedSector } from "@/services/property-sector";
import {
  findPropertyTexts,
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

/**
 * Names the neighbourhood of each listing from the sectors of the reference table. It never fails the catalog:
 * if the table or the texts cannot be read, the listings simply have no sector.
 */
// The sectors of the reference table change rarely: they are kept for a few minutes instead of being read on every listing.
const SECTORS_TTL_MS = 5 * 60 * 1000;
let cachedSectors: { sectors: NamedSector[]; expiresAt: number } | null = null;

async function loadSectors(): Promise<NamedSector[]> {
  if (cachedSectors && cachedSectors.expiresAt > Date.now()) return cachedSectors.sectors;
  const cities = await listValuationCities();
  const sectors = cities.flatMap((city) => city.sectors.map((sector) => ({ name: sector.name, commune: sector.commune })));
  cachedSectors = { sectors, expiresAt: Date.now() + SECTORS_TTL_MS };
  return sectors;
}

async function withSectors(records: PropertySummaryRecord[]): Promise<PropertySummary[]> {
  let sectors: NamedSector[] = [];
  let texts = new Map<string, { address: string; description: string }>();
  try {
    sectors = await loadSectors();
    texts = new Map((await findPropertyTexts(records.map((record) => record.id))).map((row) => [row.id, row]));
  } catch {
    // Without sectors the catalog still loads.
  }
  return records.map((record) => {
    const text = texts.get(record.id);
    const sector = text ? detectSector({ title: record.title, commune: record.commune, ...text }, sectors) : null;
    return { ...toPropertySummary(record), sector };
  });
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
    data: await withSectors(records),
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

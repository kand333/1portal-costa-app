import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OperationType, PropertyType } from "@/generated/prisma/enums";
import { escapeLikePattern } from "@/lib/escape-like";
import type { PropertySort } from "@portal/shared/enums";
import { prisma } from "@/lib/prisma";

const publishedOnly = { isPublished: true } satisfies Prisma.PropertyWhereInput;

const propertySummarySelect = {
  id: true,
  title: true,
  operationType: true,
  propertyType: true,
  price: true,
  currency: true,
  usableArea: true,
  totalArea: true,
  bedrooms: true,
  bathrooms: true,
  commune: true,
  city: true,
  region: true,
  isFeatured: true,
  createdAt: true,
  // Main image first; falls back to the first image by position.
  images: {
    select: { url: true },
    orderBy: [{ isMain: "desc" }, { position: "asc" }],
    take: 1,
  },
} satisfies Prisma.PropertySelect;

const propertyDetailSelect = {
  ...propertySummarySelect,
  description: true,
  parkingSpaces: true,
  ageInYears: true,
  address: true,
  updatedAt: true,
  images: {
    select: { id: true, url: true, position: true, isMain: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  },
  features: {
    select: { feature: { select: { name: true } } },
    orderBy: { feature: { name: "asc" } },
  },
} satisfies Prisma.PropertySelect;

export type PropertySummaryRecord = Prisma.PropertyGetPayload<{ select: typeof propertySummarySelect }>;
export type PropertyDetailRecord = Prisma.PropertyGetPayload<{ select: typeof propertyDetailSelect }>;

export type PublishedPropertyFilters = {
  operationType?: OperationType;
  propertyType?: PropertyType;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minUsableArea?: number;
  /** Exact location names to accept (already resolved from the URL slugs by the service). */
  communes?: string[];
  cities?: string[];
  regions?: string[];
  /**
   * Words that must all appear in the title, description, commune, city or region. They must already
   * be normalized (lowercase, no accents) because they are compared with `Property.searchText`.
   */
  searchTerms?: string[];
};

function buildWhere({
  operationType,
  propertyType,
  isFeatured,
  minPrice,
  maxPrice,
  minBedrooms,
  minBathrooms,
  minUsableArea,
  communes,
  cities,
  regions,
  searchTerms = [],
}: PublishedPropertyFilters): Prisma.PropertyWhereInput {
  // Undefined values are ignored by Prisma, so every filter is optional and they all combine (AND).
  // Minimums exclude properties without the value (e.g. land has no bedrooms).
  return {
    operationType,
    propertyType,
    isFeatured,
    price: minPrice === undefined && maxPrice === undefined ? undefined : { gte: minPrice, lte: maxPrice },
    bedrooms: minBedrooms === undefined ? undefined : { gte: minBedrooms },
    bathrooms: minBathrooms === undefined ? undefined : { gte: minBathrooms },
    usableArea: minUsableArea === undefined ? undefined : { gte: minUsableArea },
    commune: communes === undefined ? undefined : { in: communes },
    city: cities === undefined ? undefined : { in: cities },
    region: regions === undefined ? undefined : { in: regions },
    ...publishedOnly,
    // One condition per word on the pre-normalized column. Prisma does not escape the LIKE
    // wildcards (% and _) of `contains`, so they are escaped here to match literally.
    AND: searchTerms.map((term) => ({ searchText: { contains: escapeLikePattern(term) } })),
  };
}

// Every order ends with the same tie-breakers so equal values keep a stable order and
// pagination never repeats or skips a property between pages.
const stableTail = [{ createdAt: "desc" }, { id: "desc" }] as const;

const orderBySort = {
  newest: [...stableTail],
  "price-asc": [{ price: "asc" }, ...stableTail],
  "price-desc": [{ price: "desc" }, ...stableTail],
  // Area is the usable surface; properties without it (e.g. land) go last, ordered by total surface.
  "area-asc": [
    { usableArea: { sort: "asc", nulls: "last" } },
    { totalArea: { sort: "asc", nulls: "last" } },
    ...stableTail,
  ],
  "area-desc": [
    { usableArea: { sort: "desc", nulls: "last" } },
    { totalArea: { sort: "desc", nulls: "last" } },
    ...stableTail,
  ],
} satisfies Record<PropertySort, Prisma.PropertyOrderByWithRelationInput[]>;

export async function findPublishedProperties(
  filters: PublishedPropertyFilters,
  pagination: { skip: number; take: number },
  sort: PropertySort = "newest",
): Promise<{ records: PropertySummaryRecord[]; total: number }> {
  const where = buildWhere(filters);
  const [records, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      select: propertySummarySelect,
      orderBy: orderBySort[sort],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.property.count({ where }),
  ]);
  return { records, total };
}

export function findPublishedPropertyById(id: string): Promise<PropertyDetailRecord | null> {
  return prisma.property.findFirst({
    where: { ...publishedOnly, id },
    select: propertyDetailSelect,
  });
}

export type PublishedLocations = {
  communes: string[];
  cities: string[];
  regions: string[];
};

/** Distinct communes, cities and regions of the published properties. */
export async function findPublishedLocations(): Promise<PublishedLocations> {
  const [communes, cities, regions] = await prisma.$transaction([
    prisma.property.findMany({ where: publishedOnly, select: { commune: true }, distinct: ["commune"] }),
    prisma.property.findMany({ where: publishedOnly, select: { city: true }, distinct: ["city"] }),
    prisma.property.findMany({ where: publishedOnly, select: { region: true }, distinct: ["region"] }),
  ]);
  return {
    communes: communes.map((row) => row.commune),
    cities: cities.map((row) => row.city),
    regions: regions.map((row) => row.region),
  };
}

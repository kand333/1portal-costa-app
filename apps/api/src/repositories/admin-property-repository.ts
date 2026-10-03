import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { escapeLikePattern } from "@/lib/escape-like";
import { prisma } from "@/lib/prisma";
import { propertyDetailSelect, propertySummarySelect } from "@/repositories/property-repository";
import type { AdminPropertyStatus, PropertyInputData } from "@portal/shared/admin-property";
import type { OperationType, PropertyType } from "@portal/shared/enums";

const adminSummarySelect = { ...propertySummarySelect, isPublished: true, updatedAt: true, deletedAt: true } satisfies Prisma.PropertySelect;
/** Properties ADMIN can open, edit and delete: the soft-deleted ones only appear in the "deleted" list. */
const notDeleted = { deletedAt: null } satisfies Prisma.PropertyWhereInput;
const adminDetailSelect = { ...propertyDetailSelect, isPublished: true } satisfies Prisma.PropertySelect;

export type AdminPropertySummaryRecord = Prisma.PropertyGetPayload<{ select: typeof adminSummarySelect }>;
export type AdminPropertyDetailRecord = Prisma.PropertyGetPayload<{ select: typeof adminDetailSelect }>;

export type AdminPropertyFilters = {
  status: AdminPropertyStatus;
  operationType?: OperationType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  /** Exact city names (already resolved from the requested slug). */
  cities?: string[];
  /** Created at or after this instant. */
  createdFrom?: Date;
  /** Created strictly before this instant. */
  createdBefore?: Date;
  /** Normalized words (see searchText). */
  searchTerms: string[];
};

const statusWhere = {
  active: { deletedAt: null },
  published: { deletedAt: null, isPublished: true },
  draft: { deletedAt: null, isPublished: false },
  deleted: { deletedAt: { not: null } },
} satisfies Record<AdminPropertyStatus, Prisma.PropertyWhereInput>;

/**
 * Properties for the admin list; every filter combines (AND). Active ones newest first, the
 * soft-deleted ones last deleted first.
 */
export async function findAdminProperties(
  filters: AdminPropertyFilters,
  pagination: { skip: number; take: number },
): Promise<{ records: AdminPropertySummaryRecord[]; total: number }> {
  const { status, operationType, propertyType, minPrice, maxPrice, cities, createdFrom, createdBefore, searchTerms } = filters;
  // Undefined values are ignored by Prisma, so every filter is optional.
  const where: Prisma.PropertyWhereInput = {
    ...statusWhere[status],
    operationType,
    propertyType,
    price: minPrice === undefined && maxPrice === undefined ? undefined : { gte: minPrice, lte: maxPrice },
    city: cities === undefined ? undefined : { in: cities },
    createdAt: createdFrom === undefined && createdBefore === undefined ? undefined : { gte: createdFrom, lt: createdBefore },
    AND: searchTerms.map((term) => ({ searchText: { contains: escapeLikePattern(term) } })),
  };
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    status === "deleted" ? [{ deletedAt: "desc" }, { id: "desc" }] : [{ createdAt: "desc" }, { id: "desc" }];
  const [records, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
      select: adminSummarySelect,
    }),
    prisma.property.count({ where }),
  ]);
  return { records, total };
}

/** Distinct city names of every property, to resolve a city slug ("nunoa" → "Ñuñoa" and other spellings). */
export async function findAllCityNames(): Promise<string[]> {
  const rows = await prisma.property.findMany({ select: { city: true }, distinct: ["city"] });
  return rows.map((row) => row.city);
}

export function findAdminPropertyById(id: string): Promise<AdminPropertyDetailRecord | null> {
  return prisma.property.findUnique({ where: { id, ...notDeleted }, select: adminDetailSelect });
}

/** Existing feature names that match the given ones ignoring case, to reuse them instead of duplicating. */
export function findFeaturesByNames(names: string[]) {
  if (names.length === 0) return Promise.resolve([]);
  return prisma.feature.findMany({
    where: { OR: names.map((name) => ({ name: { equals: name, mode: "insensitive" as const } })) },
    select: { name: true },
  });
}

type PropertyFields = Omit<PropertyInputData, "features">;

/** Links the property to features by exact name, creating the missing ones. */
const featureLinks = (featureNames: string[]) =>
  featureNames.map((name) => ({ feature: { connectOrCreate: { where: { name }, create: { name } } } }));

export function insertProperty(fields: PropertyFields, featureNames: string[]): Promise<AdminPropertyDetailRecord> {
  return prisma.property.create({
    data: { ...fields, features: { create: featureLinks(featureNames) } },
    select: adminDetailSelect,
  });
}

/** Replaces every field and the whole set of features. Throws P2025 when it does not exist or was deleted. */
export function replaceProperty(
  id: string,
  fields: PropertyFields,
  featureNames: string[],
): Promise<AdminPropertyDetailRecord> {
  return prisma.property.update({
    where: { id, ...notDeleted },
    data: { ...fields, features: { deleteMany: {}, create: featureLinks(featureNames) } },
    select: adminDetailSelect,
  });
}

/**
 * Soft delete: stamps deletedAt and keeps every related row (images, features, favorites, inquiries).
 * Throws P2025 when it does not exist or was already deleted.
 */
export function softDeleteProperty(id: string) {
  return prisma.property.update({ where: { id, ...notDeleted }, data: { deletedAt: new Date() }, select: { id: true } });
}

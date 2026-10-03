import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/http/api-error";
import {
  findAdminProperties,
  findAllCityNames,
  findAdminPropertyById,
  findFeaturesByNames,
  insertProperty,
  replaceProperty,
  softDeleteProperty,
  type AdminPropertyDetailRecord,
} from "@/repositories/admin-property-repository";
import { namesMatchingSlugs, splitSearchTerms, toPropertyDetail, toPropertySummary } from "@/services/property-service";
import type {
  AdminPropertyDetail,
  AdminPropertyListQuery,
  AdminPropertySummary,
  PropertyInputData,
} from "@portal/shared/admin-property";
import type { PaginatedResponse } from "@portal/shared/property";

const NOT_FOUND = "Propiedad no encontrada";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const isNotFound = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

const toAdminDetail = (record: AdminPropertyDetailRecord): AdminPropertyDetail => ({
  ...toPropertyDetail(record),
  isPublished: record.isPublished,
});

/** Uses the stored spelling of features that already exist with another case ("piscina" → "Piscina"). */
async function canonicalFeatureNames(names: string[]): Promise<string[]> {
  const existing = await findFeaturesByNames(names);
  return names.map(
    (name) => existing.find((feature) => feature.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))?.name ?? name,
  );
}

function splitInput({ features, ...fields }: PropertyInputData) {
  return { fields, features };
}

export async function listAdminProperties(query: AdminPropertyListQuery): Promise<PaginatedResponse<AdminPropertySummary>> {
  const { page, pageSize, search, status, operation, type, minPrice, maxPrice, city, createdFrom, createdTo } = query;
  const filters = {
    status,
    operationType: operation,
    propertyType: type,
    minPrice,
    maxPrice,
    cities: city === undefined ? undefined : namesMatchingSlugs(await findAllCityNames(), city),
    // ponytail: days are taken in UTC (00:00Z); near midnight Chile time a property may fall on the next day.
    createdFrom: createdFrom === undefined ? undefined : new Date(`${createdFrom}T00:00:00.000Z`),
    createdBefore: createdTo === undefined ? undefined : new Date(Date.parse(`${createdTo}T00:00:00.000Z`) + DAY_IN_MS),
    searchTerms: splitSearchTerms(search),
  };
  const { records, total } = await findAdminProperties(filters, {
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return {
    data: records.map((record) => ({
      ...toPropertySummary(record),
      isPublished: record.isPublished,
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt?.toISOString() ?? null,
    })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAdminProperty(id: string): Promise<AdminPropertyDetail> {
  const record = await findAdminPropertyById(id);
  if (!record) throw new ApiError(404, NOT_FOUND);
  return toAdminDetail(record);
}

export async function createProperty(input: PropertyInputData): Promise<AdminPropertyDetail> {
  const { fields, features } = splitInput(input);
  return toAdminDetail(await insertProperty(fields, await canonicalFeatureNames(features)));
}

export async function updateProperty(id: string, input: PropertyInputData): Promise<AdminPropertyDetail> {
  const { fields, features } = splitInput(input);
  try {
    return toAdminDetail(await replaceProperty(id, fields, await canonicalFeatureNames(features)));
  } catch (error) {
    if (isNotFound(error)) throw new ApiError(404, NOT_FOUND);
    throw error;
  }
}

/**
 * Soft-deletes the property: it disappears from the portal, the users' lists and the active admin
 * list, and shows up in the "deleted" one. Its images stay (in PostgreSQL and Cloudinary).
 */
export async function removeProperty(id: string): Promise<void> {
  try {
    await softDeleteProperty(id);
  } catch (error) {
    if (isNotFound(error)) throw new ApiError(404, NOT_FOUND);
    throw error;
  }
}

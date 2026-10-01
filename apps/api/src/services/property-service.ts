import "server-only";
import { ApiError } from "@/lib/http/api-error";
import {
  findPublishedProperties,
  findPublishedPropertyById,
  type PropertyDetailRecord,
  type PropertySummaryRecord,
} from "@/repositories/property-repository";
import type { PropertyListQuery } from "@portal/shared/property-query";
import type { PaginatedResponse, PropertyDetail, PropertySummary } from "@portal/shared/property";

type DecimalLike = { toNumber(): number };

const toNullableNumber = (value: DecimalLike | null) => (value === null ? null : value.toNumber());

function toPropertySummary(record: PropertySummaryRecord): PropertySummary {
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

function toPropertyDetail(record: PropertyDetailRecord): PropertyDetail {
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

export async function listPublishedProperties({
  page,
  pageSize,
  operation,
  featured,
}: PropertyListQuery): Promise<PaginatedResponse<PropertySummary>> {
  const { records, total } = await findPublishedProperties(
    { operationType: operation, isFeatured: featured },
    { skip: (page - 1) * pageSize, take: pageSize },
  );
  return {
    data: records.map(toPropertySummary),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
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

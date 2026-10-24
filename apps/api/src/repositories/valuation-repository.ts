import "server-only";
import type { OperationType, PropertyType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { publishedOnly } from "@/repositories/property-repository";

export type ComparableFilter = {
  propertyType: PropertyType;
  operationType: OperationType;
  /** Restricts the search to one commune; omitted, it covers every published property. */
  commune?: string;
};

/** Published properties priced in CLP with a known area, the base of the price estimate. */
export function findComparableProperties(filter: ComparableFilter) {
  return prisma.property.findMany({
    where: {
      ...publishedOnly,
      currency: "CLP",
      propertyType: filter.propertyType,
      operationType: filter.operationType,
      ...(filter.commune ? { commune: { equals: filter.commune, mode: "insensitive" } } : {}),
      OR: [{ usableArea: { gt: 0 } }, { totalArea: { gt: 0 } }],
    },
    select: { price: true, usableArea: true, totalArea: true, bedrooms: true, bathrooms: true, parkingSpaces: true },
    take: 500,
  });
}

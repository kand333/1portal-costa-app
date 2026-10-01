import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OperationType } from "@/generated/prisma/enums";
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
  isFeatured?: boolean;
};

export async function findPublishedProperties(
  filters: PublishedPropertyFilters,
  pagination: { skip: number; take: number },
): Promise<{ records: PropertySummaryRecord[]; total: number }> {
  const where = { ...filters, ...publishedOnly } satisfies Prisma.PropertyWhereInput;
  const [records, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      select: propertySummarySelect,
      // Secondary key keeps pagination stable when dates are equal.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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

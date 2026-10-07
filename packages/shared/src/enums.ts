// REST contract enums. They must match the Prisma enums in apps/api/prisma/schema.prisma
// (verified by apps/api/tests/shared-contract.test.ts).

export const OPERATION_TYPES = ["SALE", "RENT"] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "LAND", "OFFICE", "COMMERCIAL", "OTHER"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const CURRENCIES = ["CLP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Catalog sort orders: newest first (default), price and area ascending or descending. */
export const PROPERTY_SORTS = ["newest", "price-asc", "price-desc", "area-asc", "area-desc"] as const;
export type PropertySort = (typeof PROPERTY_SORTS)[number];
export const DEFAULT_PROPERTY_SORT: PropertySort = "newest";

// REST contract enums. They must match the Prisma enums in apps/api/prisma/schema.prisma
// (verified by apps/api/tests/shared-contract.test.ts).

export const OPERATION_TYPES = ["SALE", "RENT"] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "LAND", "OFFICE", "COMMERCIAL", "OTHER"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const CURRENCIES = ["USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

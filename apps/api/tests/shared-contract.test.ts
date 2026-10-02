import { CURRENCIES, OPERATION_TYPES, PROPERTY_TYPES, USER_ROLES } from "@portal/shared/enums";
import { describe, expect, it } from "vitest";
import { Currency, OperationType, PropertyType, UserRole } from "@/generated/prisma/enums";

// The REST contract (@portal/shared) must stay aligned with the database enums.
describe("shared REST contract", () => {
  it("uses the same enum values as the Prisma schema", () => {
    expect([...OPERATION_TYPES]).toEqual(Object.values(OperationType));
    expect([...PROPERTY_TYPES]).toEqual(Object.values(PropertyType));
    expect([...CURRENCIES]).toEqual(Object.values(Currency));
    expect([...USER_ROLES]).toEqual(Object.values(UserRole));
  });
});

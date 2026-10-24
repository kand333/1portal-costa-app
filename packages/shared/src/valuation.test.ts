import { describe, expect, it } from "vitest";
import { valuationRequestSchema } from "./valuation";

const request = {
  address: "Barros Arana 1000",
  commune: "Concepción",
  propertyType: "APARTMENT",
  operation: "SALE",
  totalArea: 80,
  usableArea: 70,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
};

describe("valuationRequestSchema", () => {
  it("accepts a complete request", () => {
    expect(valuationRequestSchema.safeParse(request).success).toBe(true);
  });

  it("rejects built area above total area", () => {
    const result = valuationRequestSchema.safeParse({ ...request, usableArea: 90 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["usableArea"]);
  });

  it("rejects land, missing commune, out of range counts and missing numbers", () => {
    expect(valuationRequestSchema.safeParse({ ...request, propertyType: "LAND" }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, commune: " " }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, bedrooms: 0 }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, bedrooms: 7 }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, parkingSpaces: 6 }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, totalArea: undefined }).success).toBe(false);
  });

  it("defaults amenities to none, keeps each once and rejects unknown ones", () => {
    expect(valuationRequestSchema.parse(request).amenities).toEqual([]);
    expect(valuationRequestSchema.parse({ ...request, amenities: ["pool", "pool", "gym"] }).amenities).toEqual(["pool", "gym"]);
    expect(valuationRequestSchema.safeParse({ ...request, amenities: ["sauna"] }).success).toBe(false);
  });

  it("allows no parking spaces", () => {
    expect(valuationRequestSchema.safeParse({ ...request, parkingSpaces: 0 }).success).toBe(true);
  });
});

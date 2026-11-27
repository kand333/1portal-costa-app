import { describe, expect, it } from "vitest";
import { displayedComparables, displayedConfidence, valuationRequestSchema } from "./valuation";

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
  constructionYear: 2005,
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

  it("asks for the construction year: a whole year between 1900 and this year", () => {
    expect(valuationRequestSchema.parse(request).constructionYear).toBe(2005);
    const { constructionYear: _omitted, ...withoutYear } = request;
    expect(valuationRequestSchema.safeParse(withoutYear).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, constructionYear: 1899 }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, constructionYear: new Date().getFullYear() + 1 }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, constructionYear: 2005.5 }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, constructionYear: new Date().getFullYear() }).success).toBe(true);
  });

  it("takes the storage as an amenity and an optional map location", () => {
    expect(valuationRequestSchema.parse({ ...request, amenities: ["storage"] }).amenities).toEqual(["storage"]);
    expect(valuationRequestSchema.safeParse({ ...request, amenities: ["heatedPool"] }).success).toBe(false);
    expect(valuationRequestSchema.safeParse({ ...request, latitude: -36.8, longitude: -73.05 }).success).toBe(true);
    expect(valuationRequestSchema.safeParse({ ...request, latitude: 120, longitude: -73.05 }).success).toBe(false);
  });

  it("allows no parking spaces", () => {
    expect(valuationRequestSchema.safeParse({ ...request, parkingSpaces: 0 }).success).toBe(true);
  });
});

describe("what people see of the comparables and the confidence", () => {
  it("never shows fewer than 3 compared properties, and shows the real count above that", () => {
    expect([0, 1, 2, 3, 12].map(displayedComparables)).toEqual([3, 3, 3, 3, 12]);
  });

  it("shows «Media (referencial)» at least, and «Alta» only for a high confidence", () => {
    expect(displayedConfidence("low")).toBe("Media (referencial)");
    expect(displayedConfidence("medium")).toBe("Media (referencial)");
    expect(displayedConfidence("high")).toBe("Alta");
  });
});

import type { ValuationRequest } from "@portal/shared/valuation";
import { describe, expect, it } from "vitest";
import { ageFactor, AMENITY_ADJUSTMENT, estimatePrice, percentile, type Comparable, type ReferencePrice } from "./valuation-algorithm";

const YEAR = 2026;
const request: ValuationRequest = {
  address: "Barros Arana 1000",
  commune: "Concepción",
  propertyType: "APARTMENT",
  operation: "SALE",
  totalArea: 100,
  usableArea: 100,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  amenities: [],
  // 15 years old: the typical age, so the age factor is neutral.
  constructionYear: YEAR - 15,
};

// 100 m² each, 3 bedrooms, 2 bathrooms, 1 parking space, 15 years old: the request matches the typical comparable.
const comparable = (price: number, overrides: Partial<Comparable> = {}): Comparable => ({
  price,
  area: 100,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  ageInYears: 15,
  ...overrides,
});
const reference: ReferencePrice = { pricePerSquareMeter: 1_200_000, sector: "Centro" };
const estimate = (comparables: Comparable[], overrides: Partial<ValuationRequest> = {}, ref: ReferencePrice = reference) =>
  estimatePrice(comparables, { ...request, ...overrides }, "commune", ref, YEAR);

// The typical apartment without comparables has 2 bedrooms, 1 bathroom and 1 parking space.
const typicalApartment = { bedrooms: 2, bathrooms: 1, parkingSpaces: 1 } as const;

describe("percentile", () => {
  it("interpolates between values", () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0.25)).toBe(17.5);
    expect(percentile([7], 0.9)).toBe(7);
  });
});

describe("estimatePrice", () => {
  it("always gives a figure: with no comparables it is the sector reference, with a ±12 % range", () => {
    const result = estimate([], typicalApartment);
    expect(result).toMatchObject({ status: "ok", basis: "reference", confidence: "low", comparablesCount: 0, sector: "Centro" });
    expect(result.estimate).toBe(120_000_000);
    expect(result.low).toBe(105_600_000);
    expect(result.high).toBe(134_400_000);
    expect(result.pricePerSquareMeter).toBe(1_200_000);
  });

  it("ignores comparables without price or area", () => {
    const result = estimate([comparable(0), { ...comparable(100_000_000), area: 0 }]);
    expect(result).toMatchObject({ basis: "reference", comparablesCount: 0 });
  });

  it("blends the market with the reference by how many comparables there are (n / (n + 5))", () => {
    // Three comparables at 1.0, 1.2 and 1.4 million per m²: median 1.2 million, the same as the reference.
    const same = estimate([comparable(100_000_000), comparable(120_000_000), comparable(140_000_000)]);
    expect(same.estimate).toBe(120_000_000);
    expect(same).toMatchObject({ basis: "mixed", confidence: "medium", comparablesCount: 3 });
    // Cheaper market: the figure moves toward it, with weight 3/8.
    const cheaper = estimate([comparable(60_000_000), comparable(70_000_000), comparable(80_000_000)]);
    expect(cheaper.estimate).toBe(Math.round(0.375 * 70_000_000 + 0.625 * 120_000_000));
  });

  it("leans on the market with many comparables: high confidence and basis comparables", () => {
    const result = estimate(Array.from({ length: 10 }, () => comparable(80_000_000)));
    expect(result).toMatchObject({ basis: "comparables", confidence: "high", comparablesCount: 10 });
    // Weight 10/15 on 80 million, 5/15 on the 120 million reference.
    expect(result.estimate).toBe(Math.round((2 / 3) * 80_000_000 + (1 / 3) * 120_000_000));
  });

  it("drops outliers from the market median", () => {
    const withOutlier = estimate([100, 110, 120, 130, 140, 5_000].map((million) => comparable(million * 1_000_000)));
    expect(withOutlier.comparablesCount).toBe(5);
  });

  it("moves the price with bedrooms, against the typical property of the type when there are no comparables", () => {
    expect(estimate([], typicalApartment).estimate).toBe(120_000_000);
    expect(estimate([], { ...typicalApartment, bedrooms: 3 }).estimate).toBe(Math.round(120_000_000 * 1.03));
  });

  it("raises the price with amenities, the storage by 2 %, within the 15 % cap", () => {
    const base = estimate([], typicalApartment);
    const withStorage = estimate([], { ...typicalApartment, amenities: ["storage"] });
    expect(AMENITY_ADJUSTMENT.storage).toBe(0.02);
    expect(withStorage.estimate).toBe(Math.round(base.estimate * 1.02));
    const all = estimate([], {
      bedrooms: 6,
      bathrooms: 6,
      parkingSpaces: 5,
      amenities: ["pool", "gym", "concierge", "garden", "heating", "storage"],
    });
    expect(all.estimate).toBe(Math.round(base.estimate * 1.15));
  });

  it("values a newer building higher and an older one lower, 0.7 % per year, within bounds", () => {
    const at = (constructionYear: number) => estimate([], { ...typicalApartment, constructionYear }).estimate;
    expect(at(YEAR - 5)).toBe(Math.round(120_000_000 * (1 + 10 * 0.007)));
    expect(at(YEAR)).toBe(Math.round(120_000_000 * 1.1));
    expect(at(YEAR - 35)).toBe(Math.round(120_000_000 * (1 - 20 * 0.007)));
    expect(ageFactor(1900, YEAR, 15)).toBe(0.82);
    expect(ageFactor(YEAR, YEAR, 40)).toBe(1.1);
  });

  it("measures the typical age from the comparables when there are enough", () => {
    const young = [3, 3, 3].map((ageInYears) => comparable(120_000_000, { ageInYears }));
    // Against comparables that are 3 years old, a 3-year-old building is neutral; against the default 15 it would earn a premium.
    expect(estimate(young, { constructionYear: YEAR - 3 }).estimate).toBe(120_000_000);
    expect(estimate(young, { constructionYear: YEAR - 20 }).estimate).toBeLessThan(120_000_000);
  });

  it("orders the range and carries the sector and scope", () => {
    const result = estimatePrice([comparable(100_000_000), comparable(120_000_000), comparable(140_000_000)], request, "portal", reference, YEAR);
    expect(result.low).toBeLessThan(result.estimate);
    expect(result.estimate).toBeLessThan(result.high);
    expect(result).toMatchObject({ scope: "portal", sector: "Centro", uf: null });
  });
});

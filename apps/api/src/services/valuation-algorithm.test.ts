import type { ValuationRequest } from "@portal/shared/valuation";
import { describe, expect, it } from "vitest";
import { estimatePrice, percentile, type Comparable } from "./valuation-algorithm";

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
};

// 100 m² each, 3 bedrooms, 2 bathrooms, 1 parking space: the request matches the typical comparable.
const comparable = (price: number, overrides: Partial<Comparable> = {}): Comparable => ({
  price,
  area: 100,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  ...overrides,
});

describe("percentile", () => {
  it("interpolates between values", () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0.25)).toBe(17.5);
    expect(percentile([7], 0.9)).toBe(7);
  });
});

describe("estimatePrice", () => {
  it("uses the median price per square meter and the 25-75 range", () => {
    const result = estimatePrice([100e6, 120e6, 140e6, 160e6, 180e6].map((price) => comparable(price)), request, "commune");
    expect(result).toEqual({
      status: "ok",
      estimate: 140e6,
      low: 120e6,
      high: 160e6,
      pricePerSquareMeter: 1_400_000,
      comparablesCount: 5,
      scope: "commune",
      uf: null,
    });
  });

  it("scales by the built area of the requested property", () => {
    const result = estimatePrice([100e6, 120e6, 140e6].map((price) => comparable(price)), { ...request, usableArea: 50 }, "portal");
    expect(result).toMatchObject({ status: "ok", estimate: 60e6, scope: "portal" });
  });

  it("ignores an outlier", () => {
    const prices = [100e6, 110e6, 120e6, 130e6, 140e6, 900e6];
    const result = estimatePrice(prices.map((price) => comparable(price)), request, "commune");
    expect(result).toMatchObject({ status: "ok", comparablesCount: 5, estimate: 120e6 });
  });

  it("adjusts for more bedrooms, bathrooms and parking, within the cap", () => {
    const comparables = [100e6, 100e6, 100e6].map((price) => comparable(price));
    const bigger = estimatePrice(comparables, { ...request, bedrooms: 4, bathrooms: 3, parkingSpaces: 2 }, "commune");
    expect(bigger).toMatchObject({ status: "ok", estimate: 108e6 });
    const huge = estimatePrice(comparables, { ...request, bedrooms: 6, bathrooms: 6, parkingSpaces: 5 }, "commune");
    expect(huge).toMatchObject({ status: "ok", estimate: 115e6 });
  });

  it("raises the price for amenities, within the cap", () => {
    const comparables = [100e6, 100e6, 100e6].map((price) => comparable(price));
    const some = estimatePrice(comparables, { ...request, amenities: ["pool", "heatedPool"] }, "commune");
    expect(some).toMatchObject({ status: "ok", estimate: 103.5e6 });
    const all = estimatePrice(
      comparables,
      { ...request, bedrooms: 6, bathrooms: 6, parkingSpaces: 5, amenities: ["pool", "gym", "concierge", "garden", "heating", "heatedPool"] },
      "commune",
    );
    expect(all).toMatchObject({ status: "ok", estimate: 115e6 });
  });

  it("returns insufficient with fewer than three valid comparables", () => {
    expect(estimatePrice([comparable(100e6), comparable(110e6)], request, "commune")).toEqual({ status: "insufficient" });
    expect(estimatePrice([comparable(100e6), comparable(110e6), comparable(0)], request, "commune")).toEqual({ status: "insufficient" });
    expect(estimatePrice([], request, "portal")).toEqual({ status: "insufficient" });
  });
});

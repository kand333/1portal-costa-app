import { describe, expect, it } from "vitest";
import { calibrateCity, trimmedMedian, ufPerSquareMeter, validate, type ValuationSample } from "./valuation-calibration";

const sample = (sector: string, priceUf: number, area: number, overrides: Partial<ValuationSample> = {}): ValuationSample => ({
  platform: "portalinmobiliario",
  url: `https://example.test/${sector}-${priceUf}-${area}`,
  capturedOn: "2026-11-27",
  city: "Concepción",
  commune: "Concepción",
  sector,
  propertyType: "APARTMENT",
  operation: "SALE",
  priceUf,
  rentClp: null,
  area,
  bedrooms: 2,
  constructionYear: null,
  isNewProject: false,
  ...overrides,
});

// Three apartments per sector, all at the same UF per square meter: 50 in Centro, 70 in Norte, 40 in Sur.
const group = (sector: string, perM2: number) => [60, 70, 80].map((area) => sample(sector, perM2 * area, area));
const samples = [...group("Centro", 50), ...group("Norte", 70), ...group("Sur", 40)];

describe("trimmedMedian", () => {
  it("is the median without outliers, and null without values", () => {
    expect(trimmedMedian([48, 50, 52, 51, 49, 400])).toBe(50);
    expect(trimmedMedian([])).toBeNull();
    expect(trimmedMedian([0, -3])).toBeNull();
  });
});

describe("ufPerSquareMeter", () => {
  it("divides the sale price by the area, and ignores rents", () => {
    expect(ufPerSquareMeter(sample("Centro", 3000, 60))).toBe(50);
    expect(ufPerSquareMeter(sample("Centro", 3000, 60, { operation: "RENT", priceUf: null, rentClp: 400_000 }))).toBeNull();
  });
});

describe("calibrateCity", () => {
  it("takes the city base as the median of the sectors' medians", () => {
    expect(calibrateCity(samples).base.APARTMENT).toBe(50);
  });

  it("ranks the sectors by coefficient and shrinks them toward 1 with few samples", () => {
    const { sectors } = calibrateCity(samples);
    const byName = Object.fromEntries(sectors.map((sector) => [sector.sector, sector]));
    expect(byName.Norte!.rawCoefficient).toBeCloseTo(1.4);
    expect(byName.Sur!.rawCoefficient).toBeCloseTo(0.8);
    // n = 3: (3 × 1.4 + 4) / 7 = 1.171, between the raw ratio and 1.
    expect(byName.Norte!.coefficient).toBeCloseTo((3 * 1.4 + 4) / 7);
    expect(byName.Norte!.coefficient).toBeGreaterThan(byName.Centro!.coefficient);
    expect(byName.Sur!.coefficient).toBeLessThan(1);
  });

  it("trusts a sector more as it has more samples", () => {
    const many = [...samples, ...[65, 70, 75, 80, 85, 90].map((area) => sample("Norte", 70 * area, area))];
    const coefficient = (list: ValuationSample[]) => calibrateCity(list).sectors.find((sector) => sector.sector === "Norte")!.coefficient;
    expect(coefficient(many)).toBeGreaterThan(coefficient(samples));
  });

  it("leaves new projects and rents out", () => {
    const withNoise = [...samples, sample("Centro", 9000, 60, { isNewProject: true }), sample("Centro", 0, 60, { operation: "RENT", priceUf: null, rentClp: 500_000 })];
    expect(calibrateCity(withNoise).base.APARTMENT).toBe(50);
  });

  it("does not make a base for a type without enough samples", () => {
    expect(calibrateCity(samples).base.HOUSE).toBeUndefined();
    expect(calibrateCity(samples).base.LAND).toBeUndefined();
  });
});

describe("validate", () => {
  it("predicts held-out samples with a small error when the sectors are consistent", () => {
    const deeper = ["Centro", "Norte", "Sur"].flatMap((name, index) =>
      [55, 60, 65, 70, 75, 80].map((area) => sample(name, [50, 70, 40][index]! * area, area)),
    );
    const result = validate(deeper);
    expect(result.tested).toBe(18);
    expect(result.mape).toBeLessThan(0.15);
    expect(result.within20).toBe(1);
  });
});

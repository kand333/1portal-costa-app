import { describe, expect, it } from "vitest";
import {
  formatArea,
  formatLocation,
  formatPrice,
  getPropertyHighlights,
  operationLabels,
  propertyTypeLabels,
} from "./property-format";

describe("formatPrice", () => {
  it("formats sale prices in USD with Chilean separators", () => {
    expect(formatPrice(890000, "USD", "SALE")).toBe("US$890.000");
  });

  it("marks rent prices as monthly", () => {
    expect(formatPrice(1450, "USD", "RENT")).toBe("US$1.450 /mes");
  });

  it("rounds to whole units", () => {
    expect(formatPrice(215000.4, "USD", "SALE")).toBe("US$215.000");
  });
});

describe("formatLocation", () => {
  it("shows commune and city", () => {
    expect(formatLocation("Providencia", "Santiago")).toBe("Providencia, Santiago");
  });

  it("does not repeat the name when commune and city match", () => {
    expect(formatLocation("Viña del Mar", "Viña del Mar")).toBe("Viña del Mar");
  });
});

describe("labels", () => {
  it("translates every operation and property type", () => {
    expect(operationLabels).toEqual({ SALE: "Venta", RENT: "Arriendo" });
    expect(Object.keys(propertyTypeLabels)).toEqual(["HOUSE", "APARTMENT", "LAND", "OFFICE", "COMMERCIAL", "OTHER"]);
  });
});

describe("formatArea", () => {
  it("uses Chilean separators and square meters", () => {
    expect(formatArea(80.5)).toBe("80,5 m²");
    expect(formatArea(5000)).toBe("5.000 m²");
  });
});

describe("getPropertyHighlights", () => {
  const empty = { bedrooms: null, bathrooms: null, usableArea: null, totalArea: null };

  it("lists bedrooms, bathrooms and usable area with correct plurals", () => {
    expect(getPropertyHighlights({ bedrooms: 3, bathrooms: 1, usableArea: 95, totalArea: 105 })).toEqual([
      { kind: "bedrooms", text: "3 dormitorios" },
      { kind: "bathrooms", text: "1 baño" },
      { kind: "area", text: "95 m² útiles" },
    ]);
    expect(getPropertyHighlights({ ...empty, bedrooms: 1, bathrooms: 2 }).map((item) => item.text)).toEqual([
      "1 dormitorio",
      "2 baños",
    ]);
  });

  it("falls back to the total area when there is no usable area (land)", () => {
    expect(getPropertyHighlights({ ...empty, totalArea: 5000 })).toEqual([{ kind: "area", text: "5.000 m² totales" }]);
  });

  it("omits facts that do not apply", () => {
    expect(getPropertyHighlights(empty)).toEqual([]);
    expect(getPropertyHighlights({ ...empty, bedrooms: 0, bathrooms: 0 })).toEqual([]);
  });
});

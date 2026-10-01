import { describe, expect, it } from "vitest";
import { formatLocation, formatPrice, operationLabels, propertyTypeLabels } from "./property-format";

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

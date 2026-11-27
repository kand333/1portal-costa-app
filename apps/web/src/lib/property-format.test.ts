import { describe, expect, it } from "vitest";
import {
  formatAge,
  formatArea,
  formatClp,
  formatUfAmount,
  getCardStats,
  getDetailStats,
  toUf,
  formatLocation,
  formatPrice,
  getPropertyFacts,
  getPropertyHighlights,
  operationLabels,
  propertyTypeLabels,
} from "./property-format";

describe("formatPrice", () => {
  it("shows sale prices in millions of pesos", () => {
    expect(formatPrice(846_000_000, "CLP", "SALE")).toBe("$846 millones");
    expect(formatPrice(1_450_000_000, "CLP", "SALE")).toBe("$1.450 millones");
    expect(formatPrice(97_540_000, "CLP", "SALE")).toBe("$97,5 millones");
    expect(formatPrice(1_000_000, "CLP", "SALE")).toBe("$1 millón");
  });

  it("shows sale prices under a million in full", () => {
    expect(formatPrice(807_500.4, "CLP", "SALE")).toBe("$807.500");
  });

  it("shows rent prices in full and monthly", () => {
    expect(formatPrice(1_380_000, "CLP", "RENT")).toBe("$1.380.000 /mes");
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

describe("formatAge", () => {
  it("calls a new building brand new", () => {
    expect(formatAge(0)).toBe("A estrenar");
  });

  it("counts years in singular and plural", () => {
    expect(formatAge(1)).toBe("1 año");
    expect(formatAge(12)).toBe("12 años");
  });
});

describe("getPropertyFacts", () => {
  const apartment = {
    operationType: "SALE" as const,
    propertyType: "APARTMENT" as const,
    usableArea: 80.5,
    totalArea: 90,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    ageInYears: 0,
  };

  it("lists every fact in the order of the data sheet", () => {
    expect(getPropertyFacts(apartment)).toEqual([
      { label: "Operación", value: "Venta" },
      { label: "Tipo", value: "Departamento" },
      { label: "Superficie útil", value: "80,5 m²" },
      { label: "Superficie total", value: "90 m²" },
      { label: "Dormitorios", value: "2" },
      { label: "Baños", value: "2" },
      { label: "Estacionamientos", value: "1" },
      { label: "Antigüedad", value: "A estrenar" },
    ]);
  });

  it("leaves out facts without a value, but keeps zero", () => {
    const land = {
      ...apartment,
      propertyType: "LAND" as const,
      usableArea: null,
      bedrooms: null,
      bathrooms: null,
      parkingSpaces: 0,
      ageInYears: null,
    };
    expect(getPropertyFacts(land).map((fact) => fact.label)).toEqual([
      "Operación",
      "Tipo",
      "Superficie total",
      "Estacionamientos",
    ]);
  });
});

describe("UF and pesos", () => {
  it("formats the full price in pesos", () => {
    expect(formatClp(89_900_000)).toBe("$89.900.000");
  });

  it("converts to whole UF, or returns null when the UF is unknown", () => {
    expect(toUf(89_900_000, 41_400)).toBe(2171);
    expect(toUf(89_900_000, null)).toBeNull();
    expect(toUf(89_900_000, 0)).toBeNull();
  });

  it("formats UF with Chilean separators", () => {
    expect(formatUfAmount(2171)).toBe("UF 2.171");
    expect(formatUfAmount(12_500)).toBe("UF 12.500");
  });
});

describe("getCardStats", () => {
  const base = { bedrooms: 2, bathrooms: 2, usableArea: 57, totalArea: 60 };

  it("gives the three short figures", () => {
    expect(getCardStats(base).map((stat) => stat.text)).toEqual(["2 dorm.", "2 baños", "57 m²"]);
  });

  it("uses the singular, falls back to the total area and skips what does not apply", () => {
    expect(getCardStats({ ...base, bathrooms: 1 })[1]?.text).toBe("1 baño");
    expect(getCardStats({ bedrooms: null, bathrooms: null, usableArea: null, totalArea: 5000 }).map((stat) => stat.text)).toEqual(["5.000 m²"]);
    expect(getCardStats({ bedrooms: 0, bathrooms: null, usableArea: null, totalArea: null })).toEqual([]);
  });
});

describe("getDetailStats", () => {
  it("lists the key figures with a label each", () => {
    expect(
      getDetailStats({ bedrooms: 2, bathrooms: 2, parkingSpaces: 1, usableArea: 57, totalArea: null, ageInYears: 20 }),
    ).toEqual([
      { value: "2", label: "dormitorios" },
      { value: "2", label: "baños" },
      { value: "1", label: "estacionamiento" },
      { value: "57 m²", label: "superficie útil" },
      { value: "20", label: "años de antigüedad" },
    ]);
  });

  it("leaves out what the property does not have", () => {
    expect(getDetailStats({ bedrooms: null, bathrooms: null, parkingSpaces: null, usableArea: null, totalArea: 5000, ageInYears: null })).toEqual([
      { value: "5.000 m²", label: "superficie total" },
    ]);
  });
});

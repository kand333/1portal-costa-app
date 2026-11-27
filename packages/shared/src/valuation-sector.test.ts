import { describe, expect, it } from "vitest";
import { valuationCityBaseSchema, valuationSectorCreateSchema, valuationSectorUpdateSchema } from "./valuation-sector";

const sector = {
  cityId: "0190f2d4-0000-7000-8000-000000000001",
  name: "Centro",
  commune: "Concepción",
  latitude: -36.827,
  longitude: -73.05,
  coefficient: 1.2,
  source: "estimado",
};

describe("valuation sector schemas", () => {
  it("accepts a sector and defaults its note", () => {
    expect(valuationSectorCreateSchema.parse(sector).note).toBe("");
  });

  it("keeps the coefficient between 0.3 and 3", () => {
    expect(valuationSectorCreateSchema.safeParse({ ...sector, coefficient: 0.1 }).success).toBe(false);
    expect(valuationSectorCreateSchema.safeParse({ ...sector, coefficient: 3.5 }).success).toBe(false);
  });

  it("allows a partial update but not an invalid field", () => {
    expect(valuationSectorUpdateSchema.safeParse({ coefficient: 1.1 }).success).toBe(true);
    expect(valuationSectorUpdateSchema.safeParse({ source: "adivinado" }).success).toBe(false);
  });

  it("requires the three base prices in UF per square meter", () => {
    expect(valuationCityBaseSchema.safeParse({ houseUfPerM2: 40, apartmentUfPerM2: 55, landUfPerM2: 8 }).success).toBe(true);
    expect(valuationCityBaseSchema.safeParse({ houseUfPerM2: 40, apartmentUfPerM2: 0, landUfPerM2: 8 }).success).toBe(false);
  });
});

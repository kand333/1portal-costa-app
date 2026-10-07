import type { AdminPropertyDetail } from "@portal/shared/admin-property";
import { describe, expect, it } from "vitest";
import {
  addFeature,
  buildFeatureOptions,
  COMMON_FEATURES,
  hasFeature,
  toggleFeature,
  toPropertyFormValues,
  validatePropertyForm,
  type PropertyFormValues,
} from "./property-form";

const filled: PropertyFormValues = {
  ...toPropertyFormValues(null),
  title: "Casa con piscina",
  description: "Amplia casa familiar con jardín.",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: "250000",
  address: "Av. Siempre Viva 742",
  commune: "Ñuñoa",
  city: "Santiago",
  region: "Región Metropolitana",
};

describe("toPropertyFormValues", () => {
  it("starts empty and unpublished for a new property", () => {
    expect(toPropertyFormValues(null)).toMatchObject({ title: "", price: "", bedrooms: "", features: [], isPublished: false, isFeatured: false });
  });

  it("fills the fields with a stored property, empty where a number does not apply", () => {
    const property = {
      title: "Terreno",
      price: 145000.5,
      usableArea: null,
      totalArea: 5000,
      bedrooms: null,
      bathrooms: 0,
      parkingSpaces: null,
      ageInYears: null,
      features: ["Vista al lago"],
      isPublished: true,
      isFeatured: true,
    } as AdminPropertyDetail;
    expect(toPropertyFormValues(property)).toMatchObject({
      title: "Terreno",
      price: "145000.5",
      usableArea: "",
      totalArea: "5000",
      bedrooms: "",
      bathrooms: "0",
      features: ["Vista al lago"],
      isPublished: true,
      isFeatured: true,
    });
  });
});

describe("validatePropertyForm", () => {
  it("builds the request body: numbers parsed, empty optional numbers as null", () => {
    const result = validatePropertyForm({ ...filled, price: "1450,5", totalArea: "300", bedrooms: "0", ageInYears: " " });
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({ price: 1450.5, totalArea: 300, usableArea: null, bedrooms: 0, ageInYears: null, currency: "CLP" }),
    });
  });

  it("returns one message per invalid field", () => {
    const result = validatePropertyForm({ ...filled, title: "", operationType: "", price: "", bedrooms: "2.5", usableArea: "abc" });
    expect(result).toEqual({
      success: false,
      errors: {
        title: "Ingresa un título",
        operationType: "Elige venta o arriendo",
        price: "Ingresa un precio válido",
        bedrooms: "Ingresa un número entero",
        usableArea: "Ingresa una superficie válida",
      },
    });
  });

  it("rejects a zero price", () => {
    expect(validatePropertyForm({ ...filled, price: "0" })).toEqual({ success: false, errors: { price: "El precio debe ser mayor que 0" } });
  });
});

describe("addFeature", () => {
  it("adds trimmed names, skipping empty and repeated ones ignoring case", () => {
    expect(addFeature([], "  Piscina ")).toEqual(["Piscina"]);
    expect(addFeature(["Piscina"], "piscina")).toEqual(["Piscina"]);
    expect(addFeature(["Piscina"], "   ")).toEqual(["Piscina"]);
    expect(addFeature(["Piscina"], "Quincho")).toEqual(["Piscina", "Quincho"]);
  });
});

describe("feature checkboxes", () => {
  it("offers the common features first, then the other ones once", () => {
    const options = buildFeatureOptions(["Vista al lago", "piscina", "vista al lago"]);
    expect(options.slice(0, COMMON_FEATURES.length)).toEqual([...COMMON_FEATURES]);
    expect(options.slice(COMMON_FEATURES.length)).toEqual(["Vista al lago"]);
    expect(COMMON_FEATURES).toHaveLength(12);
  });

  it("checks and unchecks ignoring case", () => {
    expect(hasFeature(["piscina"], "Piscina")).toBe(true);
    expect(toggleFeature(["Jardín"], "Piscina", true)).toEqual(["Jardín", "Piscina"]);
    expect(toggleFeature(["Jardín", "piscina"], "Piscina", false)).toEqual(["Jardín"]);
    expect(toggleFeature(["Piscina"], "piscina", true)).toEqual(["Piscina"]);
  });
});

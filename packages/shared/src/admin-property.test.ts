import { describe, expect, it } from "vitest";
import { adminPropertyListQuerySchema, propertyInputSchema } from "./admin-property";

const valid = {
  title: "  Casa con piscina  ",
  description: "Amplia casa familiar con jardín.",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 250000,
  address: "Av. Siempre Viva 742",
  commune: "Ñuñoa",
  city: "Santiago",
  region: "Región Metropolitana",
};

const firstError = (input: Record<string, unknown>) => {
  const result = propertyInputSchema.safeParse(input);
  return result.success ? null : { path: result.error.issues[0].path.join("."), message: result.error.issues[0].message };
};

describe("propertyInputSchema", () => {
  it("accepts the required fields and fills the optional ones", () => {
    expect(propertyInputSchema.parse(valid)).toEqual({
      ...valid,
      title: "Casa con piscina",
      currency: "USD",
      usableArea: null,
      totalArea: null,
      bedrooms: null,
      bathrooms: null,
      parkingSpaces: null,
      ageInYears: null,
      isPublished: false,
      isFeatured: false,
      features: [],
    });
  });

  it("removes empty and repeated features, ignoring case", () => {
    expect(propertyInputSchema.parse({ ...valid, features: [" Piscina ", "piscina", "", "Quincho"] }).features).toEqual([
      "Piscina",
      "Quincho",
    ]);
  });

  it("accepts zero for counts (a new building, no parking) and null when they do not apply", () => {
    const parsed = propertyInputSchema.parse({ ...valid, ageInYears: 0, parkingSpaces: 0, bedrooms: null });
    expect(parsed).toMatchObject({ ageInYears: 0, parkingSpaces: 0, bedrooms: null });
  });

  it.each([
    [{ title: "ab" }, "title", "Ingresa un título"],
    [{ description: "corta" }, "description", "Ingresa una descripción"],
    [{ operationType: "LEASE" }, "operationType", "Elige venta o arriendo"],
    [{ price: 0 }, "price", "El precio debe ser mayor que 0"],
    [{ price: "250000" }, "price", "Ingresa un precio válido"],
    [{ usableArea: -5 }, "usableArea", "La superficie debe ser mayor que 0"],
    [{ bedrooms: 2.5 }, "bedrooms", "Ingresa un número entero"],
    [{ bathrooms: -1 }, "bathrooms", "No puede ser negativo"],
    [{ commune: " " }, "commune", "Ingresa la comuna"],
    [{ features: Array.from({ length: 31 }, (_, index) => `Característica ${index}`) }, "features", "Máximo 30 características"],
  ])("rejects %o", (override, path, message) => {
    expect(firstError({ ...valid, ...override })).toEqual({ path, message });
  });

  it("has no latitude or longitude fields", () => {
    expect(Object.keys(propertyInputSchema.shape)).not.toEqual(expect.arrayContaining(["latitude", "longitude"]));
  });
});

describe("adminPropertyListQuerySchema", () => {
  it("reads page, page size, search and status (active by default), ignoring unknown parameters", () => {
    expect(adminPropertyListQuerySchema.parse({ page: "2", search: "casa", sort: "price-asc" })).toEqual({
      page: 2,
      pageSize: 12,
      search: "casa",
      status: "active",
    });
    expect(adminPropertyListQuerySchema.parse({ status: "deleted" }).status).toBe("deleted");
  });

  it("rejects an unknown status", () => {
    expect(adminPropertyListQuerySchema.safeParse({ status: "trash" }).success).toBe(false);
  });
});

describe("adminPropertyListQuerySchema filters", () => {
  it("reads every filter, ignoring empty values", () => {
    expect(
      adminPropertyListQuerySchema.parse({
        status: "draft",
        operation: "RENT",
        type: "HOUSE",
        minPrice: "1000",
        maxPrice: "",
        city: "santiago",
        createdFrom: "2026-09-01",
        createdTo: "2026-09-30",
      }),
    ).toMatchObject({
      status: "draft",
      operation: "RENT",
      type: "HOUSE",
      minPrice: 1000,
      maxPrice: undefined,
      city: ["santiago"],
      createdFrom: "2026-09-01",
      createdTo: "2026-09-30",
    });
    expect(adminPropertyListQuerySchema.parse({ status: "" }).status).toBe("active");
  });

  it.each([
    [{ minPrice: "5000", maxPrice: "1000" }, "El precio mínimo no puede ser mayor que el máximo"],
    [{ createdFrom: "2026-10-02", createdTo: "2026-10-01" }, "La fecha inicial no puede ser posterior a la final"],
    [{ createdFrom: "02-10-2026" }, "Ingresa una fecha válida"],
    [{ status: "archived" }, "Estado de propiedad inválido"],
  ])("rejects %o", (query, message) => {
    const result = adminPropertyListQuerySchema.safeParse(query);
    expect(result.success ? null : result.error.issues[0].message).toBe(message);
  });
});

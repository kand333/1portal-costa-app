import { describe, expect, it } from "vitest";
import { MAX_FILTER_AMOUNT, MAX_LOCATIONS_PER_FILTER, MAX_ROOMS_FILTER } from "./limits";
import { propertyListQuerySchema } from "./property-query";

const parse = (query: Record<string, string | string[]>) => propertyListQuerySchema.safeParse(query);

describe("propertyListQuerySchema filters", () => {
  it("accepts every filter at once and converts the values", () => {
    const result = parse({
      operation: "SALE",
      type: "APARTMENT",
      minPrice: "100000",
      maxPrice: "250000.50",
      bedrooms: "3",
      bathrooms: "2",
      minUsableArea: "80.5",
      commune: "las-condes",
      city: "santiago",
      region: "region-metropolitana",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      operation: "SALE",
      type: "APARTMENT",
      minPrice: 100000,
      maxPrice: 250000.5,
      bedrooms: 3,
      bathrooms: 2,
      minUsableArea: 80.5,
      commune: ["las-condes"],
      city: ["santiago"],
      region: ["region-metropolitana"],
    });
  });

  it("treats empty values as unused filters", () => {
    const result = parse({ operation: "", type: " ", minPrice: "", bedrooms: "", commune: "" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      operation: undefined,
      type: undefined,
      minPrice: undefined,
      bedrooms: undefined,
      commune: undefined,
    });
  });

  it("normalizes location slugs to lowercase", () => {
    expect(parse({ commune: "Las-Condes" }).data?.commune).toEqual(["las-condes"]);
  });

  it("accepts several values per location filter, without duplicates", () => {
    expect(parse({ commune: ["las-condes", "providencia", "Las-Condes"] }).data?.commune).toEqual(["las-condes", "providencia"]);
  });

  it("drops empty location values and treats an all-empty list as no filter", () => {
    expect(parse({ commune: ["", "nunoa", " "] }).data?.commune).toEqual(["nunoa"]);
    expect(parse({ commune: ["", " "] }).data?.commune).toBeUndefined();
  });

  it("rejects the whole list when one location value is invalid", () => {
    expect(parse({ commune: ["nunoa", "las condes"] }).success).toBe(false);
  });

  it("limits the number of values per location filter", () => {
    const slugs = Array.from({ length: MAX_LOCATIONS_PER_FILTER + 1 }, (_, index) => `comuna-${index}`);
    expect(parse({ commune: slugs.slice(0, -1) }).success).toBe(true);
    expect(parse({ commune: slugs }).success).toBe(false);
  });

  it("accepts equal minimum and maximum prices", () => {
    expect(parse({ minPrice: "1000", maxPrice: "1000" }).success).toBe(true);
  });

  it("rejects a minimum price greater than the maximum", () => {
    const result = parse({ minPrice: "300000", maxPrice: "100000" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["maxPrice"]);
  });

  it.each<Record<string, string>>([
    { type: "CASTLE" },
    { type: "house" },
    { minPrice: "-1" },
    { maxPrice: "abc" },
    { maxPrice: "Infinity" },
    { minUsableArea: "-5" },
    { minPrice: String(MAX_FILTER_AMOUNT + 1) },
    { bedrooms: "2.5" },
    { bedrooms: "-1" },
    { bathrooms: String(MAX_ROOMS_FILTER + 1) },
    { commune: "las condes" },
    { commune: "las_condes" },
    { commune: "ñuñoa" },
    { region: "-santiago" },
    { city: "santiago-" },
    { city: "a".repeat(101) },
  ])("rejects the invalid filter %o", (query) => {
    expect(parse(query).success).toBe(false);
  });
});

describe("propertyListQuerySchema sort", () => {
  it.each(["newest", "price-asc", "price-desc", "area-asc", "area-desc"])("accepts the order %s", (sort) => {
    expect(parse({ sort }).data?.sort).toBe(sort);
  });

  it("treats an absent or empty sort as the default order", () => {
    expect(parse({}).data?.sort).toBeUndefined();
    expect(parse({ sort: "" }).data?.sort).toBeUndefined();
  });

  it.each(["price", "PRICE-ASC", "price_asc", "random", "price-asc,area-asc"])("rejects the unknown order %s", (sort) => {
    expect(parse({ sort }).success).toBe(false);
  });

  it("rejects a repeated sort parameter", () => {
    expect(parse({ sort: ["price-asc", "area-asc"] }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { buildCatalogFiltersHref, countActiveFilters, parseCatalogFilters } from "./catalog-filters";

const parse = (query: string) => parseCatalogFilters(new URLSearchParams(query));

describe("parseCatalogFilters", () => {
  it("reads every filter from the URL", () => {
    expect(
      parse(
        "operation=SALE&type=HOUSE&minPrice=100000&maxPrice=300000&bedrooms=3&bathrooms=2&minUsableArea=80.5&region=region-metropolitana&city=santiago&commune=las-condes",
      ),
    ).toEqual({
      operation: "SALE",
      type: "HOUSE",
      minPrice: 100000,
      maxPrice: 300000,
      bedrooms: 3,
      bathrooms: 2,
      minUsableArea: 80.5,
      region: ["region-metropolitana"],
      city: ["santiago"],
      commune: ["las-condes"],
    });
  });

  it("returns no filters for a URL without them", () => {
    expect(parse("")).toEqual({});
    expect(parse("search=casa&page=2")).toEqual({});
  });

  it("ignores empty and invalid values instead of failing", () => {
    expect(
      parse(
        "operation=BUY&type=castle&minPrice=-5&maxPrice=abc&bedrooms=0&bathrooms=2.5&minUsableArea=Infinity&commune=las condes&region=&city=-x",
      ),
    ).toEqual({});
  });

  it("normalizes slugs to lowercase", () => {
    expect(parse("commune=Las-Condes")).toEqual({ commune: ["las-condes"] });
  });

  it("drops a contradictory price range", () => {
    expect(parse("minPrice=300000&maxPrice=1000&type=HOUSE")).toEqual({ type: "HOUSE" });
  });

  it("keeps an open price range", () => {
    expect(parse("minPrice=1000")).toEqual({ minPrice: 1000 });
    expect(parse("maxPrice=1000")).toEqual({ maxPrice: 1000 });
  });
});

describe("countActiveFilters", () => {
  it("counts the filters in use", () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ operation: "RENT", bedrooms: 2, commune: ["nunoa"] })).toBe(3);
    expect(countActiveFilters({ commune: ["nunoa", "providencia"], region: ["region-metropolitana"] })).toBe(3);
  });
});

describe("buildCatalogFiltersHref", () => {
  it("writes the filters and keeps the search", () => {
    expect(
      buildCatalogFiltersHref("/properties", new URLSearchParams("search=casa"), {
        operation: "SALE",
        bedrooms: 3,
        commune: ["las-condes"],
      }),
    ).toBe("/properties?search=casa&operation=SALE&bedrooms=3&commune=las-condes");
  });

  it("removes the filters that are no longer selected and resets the page", () => {
    expect(
      buildCatalogFiltersHref("/properties", new URLSearchParams("type=HOUSE&page=3&operation=RENT&search=x"), {
        operation: "SALE",
      }),
    ).toBe("/properties?search=x&operation=SALE");
  });

  it("clears every filter with an empty selection", () => {
    expect(buildCatalogFiltersHref("/properties", new URLSearchParams("type=HOUSE&minPrice=5"), {})).toBe("/properties");
  });

  it("does not mutate the given parameters", () => {
    const searchParams = new URLSearchParams("type=HOUSE");
    buildCatalogFiltersHref("/properties", searchParams, {});
    expect(searchParams.get("type")).toBe("HOUSE");
  });
});

describe("location filters with several values", () => {
  it("reads repeated parameters, dropping invalid values and duplicates", () => {
    expect(parse("commune=las-condes&commune=providencia&commune=las condes&commune=Las-Condes")).toEqual({
      commune: ["las-condes", "providencia"],
    });
  });

  it("writes each value as a repeated parameter", () => {
    expect(
      buildCatalogFiltersHref("/properties", new URLSearchParams("commune=nunoa"), {
        commune: ["las-condes", "providencia"],
        region: ["region-metropolitana"],
      }),
    ).toBe("/properties?region=region-metropolitana&commune=las-condes&commune=providencia");
  });

  it("round-trips through the URL", () => {
    const filters = { commune: ["las-condes", "providencia"], operation: "SALE" as const };
    const href = buildCatalogFiltersHref("/properties", new URLSearchParams(), filters);
    expect(parse(href.split("?")[1])).toEqual(filters);
  });
});

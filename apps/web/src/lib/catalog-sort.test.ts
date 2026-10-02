import { PROPERTY_SORTS } from "@portal/shared/enums";
import { describe, expect, it } from "vitest";
import { buildCatalogSortHref, parseSortParam } from "./catalog-sort";
import { sortLabels } from "./property-format";

describe("parseSortParam", () => {
  it.each(PROPERTY_SORTS)("accepts %s", (sort) => {
    expect(parseSortParam(sort)).toBe(sort);
  });

  it.each([null, "", "price", "PRICE-ASC", "price_asc", "cheapest"])("ignores %o", (value) => {
    expect(parseSortParam(value)).toBeUndefined();
  });
});

describe("buildCatalogSortHref", () => {
  it("sets the order and keeps the other parameters", () => {
    expect(buildCatalogSortHref("/properties", new URLSearchParams("search=casa&operation=RENT"), "price-asc")).toBe(
      "/properties?search=casa&operation=RENT&sort=price-asc",
    );
  });

  it("replaces the previous order and resets the page", () => {
    expect(buildCatalogSortHref("/properties", new URLSearchParams("sort=price-asc&page=3"), "area-desc")).toBe(
      "/properties?sort=area-desc",
    );
  });

  it("leaves the default order out of the URL", () => {
    expect(buildCatalogSortHref("/properties", new URLSearchParams("sort=price-asc&type=HOUSE"), "newest")).toBe(
      "/properties?type=HOUSE",
    );
    expect(buildCatalogSortHref("/properties", new URLSearchParams("sort=price-asc"), "newest")).toBe("/properties");
  });

  it("does not mutate the given parameters", () => {
    const searchParams = new URLSearchParams("page=2");
    buildCatalogSortHref("/properties", searchParams, "price-asc");
    expect(searchParams.get("page")).toBe("2");
  });
});

describe("sortLabels", () => {
  it("has a Spanish label for every order", () => {
    expect(Object.keys(sortLabels)).toEqual([...PROPERTY_SORTS]);
    expect(sortLabels.newest).toBe("Más recientes");
    expect(sortLabels["price-asc"]).toBe("Precio: menor a mayor");
    expect(sortLabels["area-desc"]).toBe("Superficie: mayor a menor");
  });
});

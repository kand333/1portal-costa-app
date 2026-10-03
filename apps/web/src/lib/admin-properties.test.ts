import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { describe, expect, it } from "vitest";
import {
  buildAdminPropertiesApiPath,
  countActiveFilters,
  parseAdminPropertyListParams,
  toAdminPropertyListQuery,
  type AdminPropertyListParams,
} from "./admin-properties";

const defaults: AdminPropertyListParams = { page: 1, search: "", status: "active" };

describe("parseAdminPropertyListParams", () => {
  it("reads the page, the trimmed search and every filter", () => {
    expect(
      parseAdminPropertyListParams({
        page: "3",
        search: "  Ñuñoa ",
        status: "draft",
        operation: "RENT",
        type: "HOUSE",
        minPrice: "1000",
        maxPrice: "2500.5",
        city: "Santiago",
        createdFrom: "2026-09-01",
        createdTo: "2026-09-30",
      }),
    ).toEqual({
      page: 3,
      search: "Ñuñoa",
      status: "draft",
      operation: "RENT",
      type: "HOUSE",
      minPrice: 1000,
      maxPrice: 2500.5,
      city: "santiago",
      createdFrom: "2026-09-01",
      createdTo: "2026-09-30",
    });
  });

  it("falls back to the defaults and keeps the first of repeated values", () => {
    expect(parseAdminPropertyListParams({})).toEqual(defaults);
    expect(parseAdminPropertyListParams({ page: ["2", "5"], search: ["casa", "depto"], status: ["deleted"] })).toMatchObject({
      page: 2,
      search: "casa",
      status: "deleted",
    });
  });

  it("drops invalid values and reversed ranges, so a hand-edited URL never breaks the page", () => {
    expect(
      parseAdminPropertyListParams({
        page: "abc",
        status: "trash",
        operation: "LEASE",
        type: "castle",
        minPrice: "-5",
        city: "las condes!",
        createdFrom: "2026-02-30x",
      }),
    ).toEqual(defaults);
    expect(parseAdminPropertyListParams({ minPrice: "5000", maxPrice: "100" })).toMatchObject({ minPrice: 5000, maxPrice: undefined });
    expect(parseAdminPropertyListParams({ createdFrom: "2026-10-02", createdTo: "2026-10-01" })).toMatchObject({
      createdFrom: "2026-10-02",
      createdTo: undefined,
    });
  });

  it("cuts a search longer than the API accepts", () => {
    expect(parseAdminPropertyListParams({ search: "a".repeat(MAX_SEARCH_LENGTH + 10) }).search).toHaveLength(MAX_SEARCH_LENGTH);
  });
});

describe("admin property list query", () => {
  it("omits the defaults", () => {
    expect(toAdminPropertyListQuery(defaults).toString()).toBe("");
    expect(buildAdminPropertiesApiPath(defaults)).toBe("/api/admin/properties");
  });

  it("encodes the search, the filters and the page", () => {
    expect(buildAdminPropertiesApiPath({ ...defaults, page: 2, search: "casa ñuñoa" })).toBe(
      "/api/admin/properties?search=casa+%C3%B1u%C3%B1oa&page=2",
    );
    expect(
      toAdminPropertyListQuery({ ...defaults, status: "deleted", operation: "SALE", minPrice: 0, city: "santiago", createdTo: "2026-10-01" }).toString(),
    ).toBe("status=deleted&operation=SALE&minPrice=0&city=santiago&createdTo=2026-10-01");
  });

  it("counts the filters in use (a range counts once)", () => {
    expect(countActiveFilters(defaults)).toBe(0);
    expect(countActiveFilters({ status: "published", minPrice: 1, maxPrice: 2, city: "santiago", createdTo: "2026-10-01" })).toBe(4);
  });
});

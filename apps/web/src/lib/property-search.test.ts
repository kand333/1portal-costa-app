import { describe, expect, it } from "vitest";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import {
  buildCatalogSearchHref,
  buildPropertiesApiUrl,
  buildPropertySearchHref,
  parseSearchParam,
} from "./property-search";

describe("buildPropertySearchHref", () => {
  it("keeps only non-empty, trimmed values", () => {
    expect(buildPropertySearchHref({ search: "  Providencia ", operation: "SALE", type: "" })).toBe(
      "/properties?search=Providencia&operation=SALE",
    );
  });

  it("returns the plain catalog URL when nothing is selected", () => {
    expect(buildPropertySearchHref({ search: "   ", operation: "", type: undefined })).toBe("/properties");
  });

  it("encodes special characters", () => {
    expect(buildPropertySearchHref({ search: "Ñuñoa & más" })).toBe("/properties?search=%C3%91u%C3%B1oa+%26+m%C3%A1s");
  });
});

describe("buildPropertiesApiUrl", () => {
  it("serializes defined values and skips undefined ones", () => {
    expect(buildPropertiesApiUrl({ featured: true, pageSize: 6, operation: undefined })).toBe(
      "/api/properties?featured=true&pageSize=6",
    );
  });

  it("returns the bare endpoint without parameters", () => {
    expect(buildPropertiesApiUrl({})).toBe("/api/properties");
  });
});

describe("parseSearchParam", () => {
  it("trims the value", () => {
    expect(parseSearchParam("  providencia ")).toBe("providencia");
  });

  it.each([null, "", "   "])("returns undefined for %o", (value) => {
    expect(parseSearchParam(value)).toBeUndefined();
  });

  it("cuts a value longer than the API limit", () => {
    const search = parseSearchParam("a".repeat(MAX_SEARCH_LENGTH + 50));
    expect(search).toHaveLength(MAX_SEARCH_LENGTH);
  });
});

describe("buildCatalogSearchHref", () => {
  it("sets the search and keeps the other parameters", () => {
    expect(buildCatalogSearchHref("/properties", new URLSearchParams("operation=SALE"), " Las Condes ")).toBe(
      "/properties?operation=SALE&search=Las+Condes",
    );
  });

  it("replaces the previous search", () => {
    expect(buildCatalogSearchHref("/properties", new URLSearchParams("search=casa&type=HOUSE"), "depto")).toBe(
      "/properties?search=depto&type=HOUSE",
    );
  });

  it("drops the page because the results change", () => {
    expect(buildCatalogSearchHref("/properties", new URLSearchParams("page=3&search=casa"), "casa")).toBe(
      "/properties?search=casa",
    );
  });

  it("removes the search when it is empty", () => {
    expect(buildCatalogSearchHref("/properties", new URLSearchParams("search=casa&page=2&type=HOUSE"), "  ")).toBe(
      "/properties?type=HOUSE",
    );
    expect(buildCatalogSearchHref("/properties", new URLSearchParams("search=casa"), "")).toBe("/properties");
  });

  it("does not mutate the given parameters", () => {
    const searchParams = new URLSearchParams("page=2");
    buildCatalogSearchHref("/properties", searchParams, "casa");
    expect(searchParams.get("page")).toBe("2");
  });
});

describe("buildPropertiesApiUrl with lists", () => {
  it("repeats the parameter for each value", () => {
    expect(buildPropertiesApiUrl({ commune: ["las-condes", "providencia"], page: 1 })).toBe(
      "/api/properties?commune=las-condes&commune=providencia&page=1",
    );
  });
});

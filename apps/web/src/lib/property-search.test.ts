import { describe, expect, it } from "vitest";
import { buildPropertiesApiUrl, buildPropertySearchHref } from "./property-search";

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

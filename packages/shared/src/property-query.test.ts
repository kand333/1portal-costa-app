import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MAX_SEARCH_LENGTH } from "./limits";
import { propertyIdSchema, propertyListQuerySchema } from "./property-query";

describe("propertyListQuerySchema", () => {
  it("applies defaults when no parameters are given", () => {
    expect(propertyListQuerySchema.parse({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it("coerces numeric strings from the query string", () => {
    expect(propertyListQuerySchema.parse({ page: "3", pageSize: "20" })).toEqual({ page: 3, pageSize: 20 });
  });

  it.each([
    { page: "0" },
    { page: "-1" },
    { page: "1.5" },
    { page: "abc" },
    { pageSize: "0" },
    { pageSize: String(MAX_PAGE_SIZE + 1) },
  ])("rejects invalid pagination %o", (query) => {
    expect(propertyListQuerySchema.safeParse(query).success).toBe(false);
  });

  it("accepts the operation and featured filters", () => {
    expect(propertyListQuerySchema.parse({ operation: "RENT", featured: "true" })).toMatchObject({
      operation: "RENT",
      featured: true,
    });
    expect(propertyListQuerySchema.parse({ featured: "false" }).featured).toBe(false);
  });

  it.each([{ operation: "BUY" }, { operation: "sale" }, { featured: "maybe" }])("rejects invalid filters %o", (query) => {
    expect(propertyListQuerySchema.safeParse(query).success).toBe(false);
  });

  it("trims the search text", () => {
    expect(propertyListQuerySchema.parse({ search: "  providencia  " }).search).toBe("providencia");
  });

  it.each(["", "   "])("treats an empty search (%o) as no search", (search) => {
    expect(propertyListQuerySchema.parse({ search }).search).toBeUndefined();
  });

  it("accepts a search of the maximum length and rejects a longer one", () => {
    expect(propertyListQuerySchema.safeParse({ search: "a".repeat(MAX_SEARCH_LENGTH) }).success).toBe(true);
    expect(propertyListQuerySchema.safeParse({ search: "a".repeat(MAX_SEARCH_LENGTH + 1) }).success).toBe(false);
  });

  it("ignores unknown parameters", () => {
    expect(propertyListQuerySchema.parse({ unknown: "x" })).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });
});

describe("propertyIdSchema", () => {
  it("accepts UUIDs and rejects anything else", () => {
    expect(propertyIdSchema.safeParse("5eed0000-0000-4000-8000-000000000001").success).toBe(true);
    expect(propertyIdSchema.safeParse("123").success).toBe(false);
    expect(propertyIdSchema.safeParse("'; drop table").success).toBe(false);
  });
});

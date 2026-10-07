import { describe, expect, it } from "vitest";
import { CURRENCIES, OPERATION_TYPES, PROPERTY_TYPES } from "./enums";

describe("shared enums", () => {
  it("define the values required by the specification", () => {
    expect(OPERATION_TYPES).toEqual(["SALE", "RENT"]);
    expect(PROPERTY_TYPES).toEqual(["HOUSE", "APARTMENT", "LAND", "OFFICE", "COMMERCIAL", "OTHER"]);
    expect(CURRENCIES).toEqual(["CLP"]);
  });
});

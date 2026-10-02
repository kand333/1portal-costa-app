import { describe, expect, it } from "vitest";
import { normalizeSearchText } from "./normalize-search-text";

describe("normalizeSearchText", () => {
  it.each([
    ["Maipú", "maipu"],
    ["Ñuñoa", "nunoa"],
    ["Peñalolén", "penalolen"],
    ["Valparaíso", "valparaiso"],
    ["Concón", "concon"],
    ["Viña del Mar", "vina del mar"],
    ["Región de Los Ríos", "region de los rios"],
    ["pingüino", "pinguino"],
    ["ÁÉÍÓÚ ÀÈÌÒÙ ÂÊÎÔÛ ÃÕ ÄËÏÖÜ Ç Ñ Ý", "aeiou aeiou aeiou ao aeiou c n y"],
  ])("removes accents and case from %s", (input, expected) => {
    expect(normalizeSearchText(input)).toBe(expected);
  });

  it("leaves plain text, digits and punctuation untouched besides the case", () => {
    expect(normalizeSearchText("Av. Apoquindo 3000, Depto 12-B")).toBe("av. apoquindo 3000, depto 12-b");
    expect(normalizeSearchText("")).toBe("");
  });

  it("treats decomposed Unicode (letter plus separate accent) like its composed form", () => {
    expect(normalizeSearchText("Maipu\u0301")).toBe("maipu");
    expect(normalizeSearchText("N\u0303un\u0303oa")).toBe("nunoa");
    expect(normalizeSearchText("N\u0303un\u0303oa")).toBe(normalizeSearchText("\u00D1u\u00F1oa"));
  });

  it("removes stray combining marks", () => {
    expect(normalizeSearchText("x\u0301")).toBe("x");
  });

  it("handles any Latin letter with diacritics, not only Spanish ones", () => {
    expect(normalizeSearchText("Šumava çà ũ Łódź")).toBe("sumava ca u łodz");
  });

  it("leaves letters that do not decompose into base letter and accent", () => {
    expect(normalizeSearchText("ß ø æ")).toBe("ß ø æ");
  });

  it("is idempotent", () => {
    const once = normalizeSearchText("Ñuñoa Maipú");
    expect(normalizeSearchText(once)).toBe(once);
  });
});

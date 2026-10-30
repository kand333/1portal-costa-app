import { LOCATION_SLUG_PATTERN } from "@portal/shared/limits";
import { citiesOfRegion, REGIONS, sectorsOfCity, toLocationSlug } from "@portal/shared/locations";
import { describe, expect, it } from "vitest";
import { toSlug } from "./slug";

describe("toSlug", () => {
  it.each([
    ["Las Condes", "las-condes"],
    ["Ñuñoa", "nunoa"],
    ["Región Metropolitana", "region-metropolitana"],
    ["Viña del Mar", "vina-del-mar"],
    ["San Pedro de la Paz", "san-pedro-de-la-paz"],
    ["  Puerto   Varas ", "puerto-varas"],
    ["Región de O'Higgins", "region-de-o-higgins"],
    ["Santiago (Centro)", "santiago-centro"],
  ])("converts %s to %s", (name, slug) => {
    expect(toSlug(name)).toBe(slug);
  });

  it("produces slugs accepted by the filters contract", () => {
    for (const name of ["Las Condes", "Ñuñoa", "Región de O'Higgins", "Concón"]) {
      expect(toSlug(name)).toMatch(LOCATION_SLUG_PATTERN);
    }
  });

  it("gives the same slug to names that only differ in accents or case", () => {
    expect(toSlug("Ñuñoa")).toBe(toSlug("NUNOA"));
    expect(toSlug("Concón")).toBe(toSlug("concon"));
  });
});

describe("locations of @portal/shared", () => {
  it("uses the same slugs as the API for every region, city and sector", () => {
    const names = REGIONS.flatMap((region) => [region.name, ...citiesOfRegion(region.slug).flatMap((city) => [city.name, ...sectorsOfCity(city.slug).map((sector) => sector.name)])]);
    for (const name of names) {
      expect(toLocationSlug(name), name).toBe(toSlug(name));
      expect(toSlug(name), name).toMatch(LOCATION_SLUG_PATTERN);
    }
  });
});

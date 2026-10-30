import { describe, expect, it } from "vitest";
import {
  ARAUCO_REGION,
  centerSectorOf,
  citiesOfRegion,
  DEFAULT_REGION,
  DEFAULT_REGION_SLUG,
  regionOfCity,
  REGION_FIELD_LABEL,
  REGIONS,
  sectorsOfCity,
  toLocationSlug,
} from "./locations";

describe("toLocationSlug", () => {
  it.each([
    ["Ñuñoa", "nunoa"],
    ["Región del Biobío", "region-del-biobio"],
    ["Lomas de San Andrés", "lomas-de-san-andres"],
    ["  Los Álamos ", "los-alamos"],
  ])("turns %s into %s", (name, slug) => {
    expect(toLocationSlug(name)).toBe(slug);
  });
});

describe("regions and cities", () => {
  it("shows the two areas of the Región del Bío-Bío as «Gran Concepción» (default) and «Provincia de Arauco»", () => {
    expect(REGION_FIELD_LABEL).toBe("Región del Bío-Bío");
    expect(REGIONS.map((region) => region.label)).toEqual(["Gran Concepción", "Provincia de Arauco"]);
    // What is stored and what URLs use does not change with the wording.
    expect(REGIONS.map((region) => region.name)).toEqual(["Región del Biobío", "Provincia Arauco"]);
    expect(DEFAULT_REGION.name).toBe("Región del Biobío");
    expect(DEFAULT_REGION_SLUG).toBe("region-del-biobio");
    expect(ARAUCO_REGION.slug).toBe("provincia-arauco");
  });

  it("lists the ten cities of Gran Concepción in the requested order", () => {
    expect(citiesOfRegion(DEFAULT_REGION_SLUG).map((city) => city.name)).toEqual([
      "Concepción",
      "San Pedro de la Paz",
      "Chiguayante",
      "Hualpén",
      "Talcahuano",
      "Penco",
      "Tomé",
      "Hualqui",
      "Coronel",
      "Lota",
    ]);
  });

  it("lists the seven communes of Arauco and nothing for an unknown region", () => {
    expect(citiesOfRegion("provincia-arauco")).toHaveLength(7);
    expect(citiesOfRegion("atlantida")).toEqual([]);
  });

  it("finds the region of a city", () => {
    expect(regionOfCity("talcahuano")?.name).toBe("Región del Biobío");
    expect(regionOfCity("lebu")?.name).toBe("Provincia Arauco");
    expect(regionOfCity("santiago")).toBeUndefined();
  });

  it("has unique slugs within each list", () => {
    for (const region of REGIONS) {
      const slugs = citiesOfRegion(region.slug).map((city) => city.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("sectors", () => {
  it("lists the fifteen sectors of Concepción and none for the other cities", () => {
    const sectors = sectorsOfCity("concepcion");
    expect(sectors).toHaveLength(15);
    expect(sectors[0].name).toBe("Centro de Concepción");
    expect(sectors.map((sector) => sector.name)).toContain("Pedro de Valdivia");
    expect(new Set(sectors.map((sector) => sector.slug)).size).toBe(15);
    expect(sectorsOfCity("talcahuano")).toEqual([]);
  });

  it("names the center sector of a city", () => {
    expect(centerSectorOf("Talcahuano")).toBe("Centro de Talcahuano");
    expect(sectorsOfCity("concepcion")[0].name).toBe(centerSectorOf("Concepción"));
  });
});

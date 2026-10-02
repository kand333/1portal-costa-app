import { beforeEach, describe, expect, it, vi } from "vitest";
import * as propertyRepository from "@/repositories/property-repository";
import {
  getPropertyFilterOptions,
  listPublishedProperties,
  namesMatchingSlugs,
  toLocationOptions,
} from "./property-service";

vi.mock("@/repositories/property-repository", () => ({
  findPublishedProperties: vi.fn(),
  findPublishedPropertyById: vi.fn(),
  findPublishedLocations: vi.fn(),
}));

const locations = {
  communes: ["Las Condes", "Ñuñoa", "NUNOA", "Providencia"],
  cities: ["Santiago", "Viña del Mar"],
  regions: ["Región Metropolitana", "Región de Valparaíso"],
};

describe("namesMatchingSlugs", () => {
  it("returns undefined when the filter is not used", () => {
    expect(namesMatchingSlugs(locations.communes, undefined)).toBeUndefined();
  });

  it("returns every spelling with the requested slug", () => {
    expect(namesMatchingSlugs(locations.communes, ["nunoa"])).toEqual(["Ñuñoa", "NUNOA"]);
    expect(namesMatchingSlugs(locations.communes, ["las-condes"])).toEqual(["Las Condes"]);
  });

  it("returns the names of every requested slug (any of them matches)", () => {
    expect(namesMatchingSlugs(locations.communes, ["las-condes", "providencia"])).toEqual(["Las Condes", "Providencia"]);
  });

  it("ignores unknown slugs among known ones", () => {
    expect(namesMatchingSlugs(locations.communes, ["atlantida", "providencia"])).toEqual(["Providencia"]);
  });

  it("returns an empty list when no slug is known so nothing matches", () => {
    expect(namesMatchingSlugs(locations.communes, ["atlantida"])).toEqual([]);
  });
});

describe("toLocationOptions", () => {
  it("builds slug and name options sorted in Spanish order", () => {
    expect(toLocationOptions(["Providencia", "Las Condes", "Ñuñoa"])).toEqual([
      { slug: "las-condes", name: "Las Condes" },
      { slug: "nunoa", name: "Ñuñoa" },
      { slug: "providencia", name: "Providencia" },
    ]);
  });

  it("collapses spellings sharing a slug and keeps the accented one, whatever the order", () => {
    expect(toLocationOptions(["NUNOA", "Ñuñoa"])).toEqual([{ slug: "nunoa", name: "Ñuñoa" }]);
    expect(toLocationOptions(["Ñuñoa", "NUNOA"])).toEqual([{ slug: "nunoa", name: "Ñuñoa" }]);
  });

  it("ignores names without letters or digits", () => {
    expect(toLocationOptions(["---", " "])).toEqual([]);
  });
});

describe("listPublishedProperties with filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(propertyRepository.findPublishedProperties).mockResolvedValue({ records: [], total: 0 });
    vi.mocked(propertyRepository.findPublishedLocations).mockResolvedValue(locations);
  });

  it("passes every filter to the repository", async () => {
    await listPublishedProperties({
      page: 1,
      pageSize: 12,
      operation: "SALE",
      type: "APARTMENT",
      minPrice: 100000,
      maxPrice: 300000,
      bedrooms: 3,
      bathrooms: 2,
      minUsableArea: 80,
      commune: ["nunoa", "las-condes"],
      city: ["santiago"],
      region: ["region-metropolitana"],
    });

    expect(propertyRepository.findPublishedProperties).toHaveBeenCalledWith(
      {
        operationType: "SALE",
        propertyType: "APARTMENT",
        isFeatured: undefined,
        minPrice: 100000,
        maxPrice: 300000,
        minBedrooms: 3,
        minBathrooms: 2,
        minUsableArea: 80,
        communes: ["Las Condes", "Ñuñoa", "NUNOA"],
        cities: ["Santiago"],
        regions: ["Región Metropolitana"],
        searchTerms: [],
      },
      { skip: 0, take: 12 },
      undefined,
    );
  });

  it("does not query the locations when no location filter is used", async () => {
    await listPublishedProperties({ page: 1, pageSize: 12, type: "HOUSE" });

    expect(propertyRepository.findPublishedLocations).not.toHaveBeenCalled();
    expect(propertyRepository.findPublishedProperties).toHaveBeenCalledWith(
      expect.objectContaining({ propertyType: "HOUSE", communes: undefined, cities: undefined, regions: undefined }),
      { skip: 0, take: 12 },
      undefined,
    );
  });

  it("filters by an empty list when the location slug is unknown", async () => {
    await listPublishedProperties({ page: 1, pageSize: 12, commune: ["atlantida"] });

    expect(propertyRepository.findPublishedProperties).toHaveBeenCalledWith(
      expect.objectContaining({ communes: [] }),
      { skip: 0, take: 12 },
      undefined,
    );
  });
});

describe("getPropertyFilterOptions", () => {
  it("returns the options of each location level", async () => {
    vi.mocked(propertyRepository.findPublishedLocations).mockResolvedValue(locations);

    expect(await getPropertyFilterOptions()).toEqual({
      regions: [
        { slug: "region-de-valparaiso", name: "Región de Valparaíso" },
        { slug: "region-metropolitana", name: "Región Metropolitana" },
      ],
      cities: [
        { slug: "santiago", name: "Santiago" },
        { slug: "vina-del-mar", name: "Viña del Mar" },
      ],
      communes: [
        { slug: "las-condes", name: "Las Condes" },
        { slug: "nunoa", name: "Ñuñoa" },
        { slug: "providencia", name: "Providencia" },
      ],
    });
  });
});

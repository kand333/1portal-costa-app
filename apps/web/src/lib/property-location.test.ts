import { describe, expect, it } from "vitest";
import { buildGoogleMapsUrl, buildMapQuery, formatPropertyAddress } from "./property-location";

const property = {
  address: "Av. Apoquindo 4500",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

describe("formatPropertyAddress", () => {
  it("joins address, commune, city and region", () => {
    expect(formatPropertyAddress(property)).toBe("Av. Apoquindo 4500, Las Condes, Santiago, Región Metropolitana");
  });

  it("does not repeat a commune that has the name of its city", () => {
    expect(
      formatPropertyAddress({ address: "Av. Brasil 100", commune: "Valparaíso", city: "Valparaíso", region: "Región de Valparaíso" }),
    ).toBe("Av. Brasil 100, Valparaíso, Región de Valparaíso");
  });

  it("skips empty parts and trims spaces", () => {
    expect(formatPropertyAddress({ ...property, address: "  ", commune: " Las Condes " })).toBe(
      "Las Condes, Santiago, Región Metropolitana",
    );
  });
});

describe("buildMapQuery", () => {
  it("adds the country so the address can be geocoded without coordinates", () => {
    expect(buildMapQuery(property)).toBe("Av. Apoquindo 4500, Las Condes, Santiago, Región Metropolitana, Chile");
  });
});

describe("buildGoogleMapsUrl", () => {
  it("builds a public search link of the address that needs no key", () => {
    const url = new URL(buildGoogleMapsUrl("Ñuñoa, Chile"));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("Ñuñoa, Chile");
    expect(url.searchParams.has("key")).toBe(false);
  });
});

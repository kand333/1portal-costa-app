import { describe, expect, it } from "vitest";
import {
  getValuationLanding,
  listValuationLandings,
  valuationLandingDescription,
  valuationLandingTitle,
} from "./valuation-landing";

describe("valuation landings", () => {
  it("exists only for houses and apartments in the five covered communes", () => {
    const paths = listValuationLandings().map((landing) => landing.path);
    expect(paths).toHaveLength(10);
    expect(paths).toEqual(expect.arrayContaining([
      "/tasacion/casa/concepcion",
      "/tasacion/departamento/concepcion",
      "/tasacion/casa/san-pedro-de-la-paz",
      "/tasacion/departamento/chiguayante",
      "/tasacion/casa/hualpen",
      "/tasacion/departamento/talcahuano",
    ]));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("returns null for unknown types and communes, including prototype keys", () => {
    expect(getValuationLanding("terreno", "concepcion")).toBeNull();
    expect(getValuationLanding("casa", "lota")).toBeNull();
    expect(getValuationLanding("constructor", "concepcion")).toBeNull();
    expect(getValuationLanding("casa", "__proto__")).toBeNull();
  });

  it("maps each type to the property type the catalog filters by", () => {
    expect(getValuationLanding("casa", "concepcion")?.propertyType).toBe("HOUSE");
    expect(getValuationLanding("departamento", "concepcion")?.propertyType).toBe("APARTMENT");
  });

  it("builds a title and a description with the zone and the service", () => {
    const landing = getValuationLanding("departamento", "concepcion");
    if (!landing) throw new Error("missing landing");
    expect(valuationLandingTitle(landing)).toBe("Tasación de departamentos en Concepción gratis | PropiZoom");
    expect(valuationLandingDescription(landing)).toContain("¿Cuánto vale tu departamento en Concepción?");
    for (const other of listValuationLandings()) {
      expect(valuationLandingDescription(other).length).toBeLessThanOrEqual(155);
    }
  });
});

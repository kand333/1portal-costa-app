import { describe, expect, it } from "vitest";
import { detectSector, sectorAliases } from "./property-sector";

const sectors = [
  { name: "Centro de Concepción", commune: "Concepción" },
  { name: "Pedro de Valdivia", commune: "Concepción" },
  { name: "Barrio Oriente - Las Tres Pascualas", commune: "Concepción" },
  { name: "Centro de Concepción", commune: "Otra" },
  { name: "Portal San Pedro", commune: "San Pedro de la Paz" },
];
const listing = (text: string, commune = "Concepción") => ({ title: text, address: "", description: "", commune });

describe("sectorAliases", () => {
  it("drops the commune suffix and splits names with a dash", () => {
    expect(sectorAliases("Centro de Concepción", "Concepción")).toEqual(["Centro"]);
    expect(sectorAliases("Barrio Oriente - Las Tres Pascualas", "Concepción")).toEqual(["Barrio Oriente", "Las Tres Pascualas"]);
    expect(sectorAliases("Pedro de Valdivia", "Concepción")).toEqual(["Pedro de Valdivia"]);
  });
});

describe("detectSector", () => {
  it("recognises a sector the listing names, without accents or case", () => {
    expect(detectSector(listing("Departamento en el CENTRO"), sectors)).toBe("Centro");
    expect(detectSector(listing("Casa en pedro de valdivia"), sectors)).toBe("Pedro de Valdivia");
    expect(detectSector(listing("A pasos de las tres pascualas"), sectors)).toBe("Las Tres Pascualas");
  });

  it("looks in the address and the description too", () => {
    expect(detectSector({ title: "Casa", address: "Calle 1, Pedro de Valdivia", description: "", commune: "Concepción" }, sectors)).toBe("Pedro de Valdivia");
    expect(detectSector({ title: "Casa", address: "", description: "Cerca del centro", commune: "Concepción" }, sectors)).toBe("Centro");
  });

  it("gives null when no sector is named, for whole words only, and for sectors of other communes", () => {
    expect(detectSector(listing("Casa luminosa con jardín"), sectors)).toBeNull();
    expect(detectSector(listing("Descentralizada"), sectors)).toBeNull();
    expect(detectSector(listing("Portal San Pedro"), sectors)).toBeNull();
    expect(detectSector(listing("Centro", "Sin tabla"), sectors)).toBeNull();
  });

  it("prefers the longest name", () => {
    expect(detectSector(listing("Barrio Oriente cerca del centro"), sectors)).toBe("Barrio Oriente");
  });
});

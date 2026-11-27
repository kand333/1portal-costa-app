import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { describe, expect, it } from "vitest";
import { buildReportContent, SMALL_SAMPLE } from "./valuation-report-data";

type OkResult = Extract<ValuationResult, { status: "ok" }>;

const request: ValuationRequest = {
  address: "DATOS DE PRUEBA 123",
  commune: "Concepción",
  propertyType: "APARTMENT",
  operation: "SALE",
  totalArea: 80,
  usableArea: 70,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  amenities: ["pool", "storage"],
  constructionYear: 2010,
};
const result: OkResult = {
  status: "ok",
  estimate: 120_000_000,
  low: 110_000_000,
  high: 130_000_000,
  pricePerSquareMeter: 1_714_286,
  comparablesCount: 7,
  scope: "commune",
  uf: null,
  basis: "mixed",
  confidence: "medium",
  sector: "Centro",
};
const issuedAt = new Date("2026-10-23T15:00:00Z");
const quote = { value: 40_000, date: "2026-10-23" };

describe("buildReportContent", () => {
  it("expresses a sale in UF with the pesos at the UF of the day", () => {
    const content = buildReportContent(request, result, issuedAt, quote);
    expect(content.hero.headline).toBe("UF 3.000");
    expect(content.hero.headlineSecondary).toBe("$120 millones");
    expect(content.hero.low).toEqual({ label: "Mínimo probable", value: "UF 2.750", sub: "$110 millones" });
    expect(content.hero.high.value).toBe("UF 3.250");
    expect(content.hero.markerShare).toBeCloseTo(0.5);
    expect(content.hero.stats[1]).toMatchObject({ label: "Por m² construido", value: "UF 42,9" });
    expect(content.hero.sourceNote).toContain("23 de octubre de 2026");
    expect(content.summary.facts).toContainEqual({ label: "Equivalente en pesos", value: "$120.000.000" });
    expect(content.summary.facts).toContainEqual({ label: "Rango probable", value: "UF 2.750 a UF 3.250" });
    expect(content.issuedOn).toBe("23 de octubre de 2026");
    expect(content.summary.conversionNote).toContain("mindicador.cl");
  });

  it("shows pesos and says the conversion is missing when there is no UF", () => {
    const content = buildReportContent(request, result, issuedAt, null);
    expect(content.hero.headline).toBe("$120.000.000");
    expect(content.hero.headlineSecondary).toBeNull();
    expect(content.hero.low.sub).toBeNull();
    expect(content.summary.conversionNote).toContain("falta actualizar la conversión");
  });

  it("keeps a rent in pesos per month even with a UF quote", () => {
    const content = buildReportContent({ ...request, operation: "RENT" }, { ...result, estimate: 450_000, low: 400_000, high: 500_000 }, issuedAt, quote);
    expect(content.hero.headline).toBe("$450.000 al mes");
    expect(content.hero.mid.value).toBe("$450.000");
    expect(content.summary.facts).toContainEqual({ label: "Rango probable", value: "$400.000 a $500.000" });
  });

  it("marks what the owner typed as informed and what is unknown as without records", () => {
    const rows = buildReportContent(request, result, issuedAt, quote).characteristics;
    expect(rows.find((row) => row.label === "Superficie construida")).toMatchObject({ value: "70 m²", status: "informed" });
    expect(rows.find((row) => row.label === "Superficie total")).toMatchObject({ value: "80 m²", status: "informed" });
    expect(rows.find((row) => row.label === "Año de construcción")).toMatchObject({ value: "2010", status: "informed" });
    for (const label of ["Materialidad y terminaciones", "Estado de conservación"]) {
      expect(rows.find((row) => row.label === label)).toMatchObject({ value: "Sin antecedentes", status: "pending" });
    }
  });

  it("lists the amenities the owner marked, and never says how much they raise the price", () => {
    const content = buildReportContent(request, result, issuedAt, quote);
    expect(content.characteristics.find((row) => row.label === "Amenidades")?.value).toContain("Bodega");
    expect(JSON.stringify(content)).not.toMatch(new RegExp("\\+\\d+(,\\d)? %"));
    expect(content.market.amenities).toEqual(["Piscina", "Bodega"]);
    expect(content.recommendations.join(" ")).not.toContain("amenidades");
    expect(content.market.notes.join(" ")).not.toContain("amenidades");
  });

  it("shows at least 3 compared properties, even with no listings behind the figure", () => {
    const content = buildReportContent(request, { ...result, comparablesCount: 1, basis: "reference", confidence: "low" }, issuedAt, quote);
    expect(content.hero.stats[0]).toMatchObject({ value: "3" });
    expect(content.market.stats[0]).toMatchObject({ value: "3" });
  });

  it("says plainly when the figure rests only on the sector reference", () => {
    const content = buildReportContent(request, { ...result, comparablesCount: 0, basis: "reference", confidence: "low" }, issuedAt, quote);
    expect(content.recommendations.join(" ")).toContain("tabla de referencia por sector");
    expect(content.hero.stats[0]).toMatchObject({ value: "3", sub: "Referencia por sector" });
    expect(content.market.stats).toContainEqual({ label: "Origen de la muestra", value: "Tabla de referencia por sector" });
    expect(content.recommendations.join(" ")).not.toContain("La muestra es pequeña");
  });

  it("uses the request data and never fixed figures", () => {
    const other = buildReportContent(
      { ...request, address: "Otra calle 9", commune: "Penco", usableArea: 55 },
      { ...result, estimate: 80_000_000, low: 70_000_000, high: 90_000_000 },
      issuedAt,
      quote,
    );
    const text = JSON.stringify(other);
    expect(text).toContain("Otra calle 9");
    expect(text).toContain("Penco");
    expect(text).toContain("UF 2.000");
    expect(text).not.toContain("3.149");
    expect(text).not.toContain("DATOS DE PRUEBA");
  });

  it("warns about a small sample and about a portal-wide scope, ", () => {
    const content = buildReportContent(request, { ...result, comparablesCount: SMALL_SAMPLE - 1, scope: "portal" }, issuedAt, quote);
    expect(content.recommendations.join(" ")).toContain("La muestra es pequeña");
    expect(content.recommendations.join(" ")).toContain("otras comunas");
    const calm = buildReportContent({ ...request, amenities: [] }, result, issuedAt, quote);
    expect(calm.recommendations.join(" ")).not.toContain("La muestra es pequeña");
    expect(calm.characteristics.find((row) => row.label === "Amenidades")?.value).toBe("Ninguna informada");
  });

  it("states that it is referential, not a professional appraisal, and that it has no environment data", () => {
    const content = buildReportContent(request, result, issuedAt, quote);
    expect(content.conclusion.scope.join(" ")).toContain("No constituye una tasación profesional presencial");
    expect(content.market.notes.join(" ")).toContain("precios publicados");
    expect(content.market.notes.join(" ")).toContain("No se incluye información del entorno");
    expect(content.conclusion.pending.join(" ")).toContain("sin antecedentes");
  });
});

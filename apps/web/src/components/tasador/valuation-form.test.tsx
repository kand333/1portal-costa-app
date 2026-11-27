import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { summarizeValuation } from "./valuation-summary";
import { ValuationForm } from "./valuation-form";

describe("ValuationForm", () => {
  const html = renderToStaticMarkup(<ValuationForm onContinue={() => undefined} onLocationChange={() => undefined} />);

  it("asks for the built area before the total area", () => {
    expect(html.indexOf("Superficie construida en m² (estimada)")).toBeGreaterThan(-1);
    expect(html.indexOf("Superficie construida")).toBeLessThan(html.indexOf("Superficie total"));
  });

  it("closes with the construction year, a numeric field, after the parking spaces", () => {
    expect(html).toContain("Año de construcción");
    expect(html).not.toContain("¿Tiene bodega?");
    expect(html.indexOf("Número de estacionamientos")).toBeLessThan(html.indexOf("Año de construcción"));
    expect(html).toMatch(/id="valuation-constructionYear"[^>]*inputMode="numeric"/);
    expect(html).toContain("una propiedad más nueva vale más");
  });
});

describe("summarizeValuation", () => {
  const request: ValuationRequest = {
    address: "Barros Arana 1000",
    commune: "Concepción",
    propertyType: "APARTMENT",
    operation: "SALE",
    totalArea: 80,
    usableArea: 70,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 1,
    amenities: [],
    constructionYear: 2008,
  };
  const result: ValuationResult = {
    status: "ok",
    estimate: 90_000_000,
    low: 80_000_000,
    high: 100_000_000,
    pricePerSquareMeter: 1_285_714,
    comparablesCount: 0,
    scope: "portal",
    uf: null,
    basis: "reference",
    confidence: "low",
    sector: null,
  };

  it("carries the construction year, and says when there were no comparables", () => {
    const text = summarizeValuation(request, result);
    expect(text).toContain("Año de construcción: 2008.");
    expect(text).toContain("referencia por sector, sin comparables");
    expect(text).not.toContain("Bodega");
  });
});

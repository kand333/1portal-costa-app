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

  it("closes with the storage question, Sí / No, after the parking spaces", () => {
    expect(html).toContain("¿Tiene bodega?");
    expect(html.indexOf("Número de estacionamientos")).toBeLessThan(html.indexOf("¿Tiene bodega?"));
    expect(html.indexOf("¿Tiene bodega?")).toBeGreaterThan(html.lastIndexOf("Superficie total"));
    expect(html.slice(html.indexOf("¿Tiene bodega?"))).toMatch(/aria-pressed="false"[^>]*>Sí<[\s\S]*aria-pressed="false"[^>]*>No</);
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
  };
  const result: ValuationResult = { status: "insufficient" };

  it("mentions the storage only when it was answered", () => {
    expect(summarizeValuation(request, result)).not.toContain("Bodega");
    expect(summarizeValuation({ ...request, hasStorage: true }, result)).toContain("Bodega: sí.");
    expect(summarizeValuation({ ...request, hasStorage: false }, result)).toContain("Bodega: no.");
  });
});

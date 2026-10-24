import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ValuationResultView } from "./valuation-result";
import { formatUf, summarizeValuation } from "./valuation-summary";

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
  amenities: ["pool", "heatedPool"],
};

const ok: ValuationResult = {
  status: "ok",
  estimate: 120_000_000,
  low: 110_000_000,
  high: 130_000_000,
  pricePerSquareMeter: 1_714_286,
  comparablesCount: 7,
  scope: "commune",
  uf: { value: 40_000, estimate: 3_000, low: 2_750, high: 3_250 },
};

const view = (overrides: { request?: ValuationRequest; result?: ValuationResult; contacted?: boolean } = {}) =>
  renderToStaticMarkup(
    <ValuationResultView
      request={overrides.request ?? request}
      result={overrides.result ?? ok}
      contacted={overrides.contacted ?? false}
      onContact={() => undefined}
      onRestart={() => undefined}
    />,
  );

describe("ValuationResultView", () => {
  it("shows a sale in UF with the pesos beneath, the range, the comparables and the chosen amenities", () => {
    const html = view();
    expect(html).toContain("3.000 UF");
    expect(html).toContain("$120.000.000");
    expect(html).toContain("2.750 UF a 3.250 UF");
    expect(html).toContain("Propiedades comparadas");
    expect(html).toContain("Amenidades: Piscina, Piscina temperada.");
    expect(html).toContain("no reemplaza una tasación bancaria");
    expect(html).toContain("Estimar otra propiedad");
  });

  it("offers the PDF report only when there is an estimate", () => {
    expect(view()).toContain("Generar Informe PDF");
    expect(view({ result: { status: "insufficient" } })).not.toContain("Generar Informe PDF");
  });

  it("falls back to pesos when the UF is unavailable", () => {
    const html = view({ result: { ...ok, uf: null } });
    expect(html).toContain("$120.000.000");
    expect(html).toContain("valor de la UF");
    expect(html).not.toContain(" UF a ");
  });

  it("explains when the estimate used the whole portal", () => {
    expect(view({ result: { ...ok, scope: "portal" } })).toContain("todo el portal");
  });

  it("does not invent a price when there is not enough data", () => {
    const html = view({ result: { status: "insufficient" } });
    expect(html).toContain("Aún no tenemos datos suficientes");
    expect(html).not.toContain("Rango probable");
  });

  it("shows a rent in pesos per month, never in UF", () => {
    const html = view({
      request: { ...request, operation: "RENT" },
      result: { ...ok, estimate: 450_000, low: 400_000, high: 500_000, uf: null },
    });
    expect(html).toContain("$450.000");
    expect(html).toContain("/mes");
    expect(html).not.toContain("valor de la UF");
  });

  it("offers contact until the person has left their data", () => {
    expect(view()).toContain("Quiero que me contacten");
    const html = view({ contacted: true });
    expect(html).not.toContain("Quiero que me contacten");
    expect(html).toContain("Recibimos tus datos");
  });
});

describe("summarizeValuation", () => {
  it("summarizes the property, the figures and the amenities for the lead message", () => {
    const text = summarizeValuation(request, ok);
    expect(text).toContain("Departamento en Concepción, 70 m² construidos (venta)");
    expect(text).toContain("3.000 UF");
    expect(text).toContain("7 comparables");
    expect(text).toContain("Amenidades: piscina, piscina temperada.");
  });

  it("states that there was no estimate", () => {
    expect(summarizeValuation({ ...request, amenities: [] }, { status: "insufficient" })).toContain("Sin estimación");
  });
});

describe("formatUf", () => {
  it("uses Chilean thousands separators and no decimals", () => {
    expect(formatUf(4820.4)).toBe("4.820 UF");
  });
});

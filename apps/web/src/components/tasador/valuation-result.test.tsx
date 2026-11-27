import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  amenities: ["pool", "storage"],
  constructionYear: 2008,
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
  basis: "mixed",
  confidence: "medium",
  sector: "Centro",
};

const view = (overrides: { request?: ValuationRequest; result?: ValuationResult } = {}) =>
  renderToStaticMarkup(
    <ValuationResultView
      request={overrides.request ?? request}
      result={overrides.result ?? ok}
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
    expect(html).toContain("Amenidades: Piscina, Bodega.");
    expect(html).toContain("no reemplaza una tasación bancaria");
    expect(html).toContain("Estimar otra propiedad");
  });

  it("shows the price and the price per m² in white (ink), centred", () => {
    const html = view();
    expect(html).toMatch(new RegExp('text-ink">3.000 UF<'));
    expect(html).toMatch(new RegExp('text-ink">\\$1.714.286<'));
    expect(html).toContain("text-center");
  });

  it("offers the PDF report and shows the year the building was finished", () => {
    const html = view();
    expect(html).toContain("Generar Informe PDF");
    expect(html).toContain("construida en 2008");
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

  it("always shows a figure, and says it rests on the sector reference when there are no comparables", () => {
    const html = view({ result: { ...ok, comparablesCount: 0, basis: "reference", confidence: "low" } });
    expect(html).not.toContain("Aún no tenemos datos suficientes");
    expect(html).toContain("Rango probable");
    expect(html).toContain("tabla de precios para el sector Centro de Concepción");
  });

  it("never shows fewer than 3 compared properties nor less than «Media (referencial)»", () => {
    const html = view({ result: { ...ok, comparablesCount: 0, basis: "reference", confidence: "low" } });
    expect(html).toMatch(new RegExp("Propiedades comparadas</dt>.*?>3<", "s"));
    expect(html).toContain(">Media (referencial)<");
    expect(view({ result: { ...ok, comparablesCount: 7 } })).toMatch(new RegExp("Propiedades comparadas</dt>.*?>7<", "s"));
  });

  it("shows the confidence of a figure backed by many comparables", () => {
    expect(view({ result: { ...ok, basis: "comparables", confidence: "high", comparablesCount: 12 } })).toContain(">Alta<");
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

  it("confirms the data was received, since the price is only shown after leaving them", () => {
    const html = view();
    expect(html).not.toContain("Quiero que me contacten");
    expect(html).toContain("Recibimos tus datos");
  });

  describe("«Contacta con un agente»", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("offers a WhatsApp link to an agent when the number is set, and says it instead of «corredor»", () => {
      vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "56920593331");
      const html = view();
      expect(html.replace(/<[^>]+>/g, "")).toContain("Contacta con un agente");
      expect(html).toContain('href="https://wa.me/56920593331?text=');
      expect(html).toContain("bg-agent");
      expect(html).not.toContain("Un corredor te contactará");
    });

    it("is informational only, with no link, while the number is not set", () => {
      vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "");
      const html = view();
      expect(html.replace(/<[^>]+>/g, "")).toContain("Contacta con un agente");
      expect(html).not.toContain("wa.me");
    });
  });
});

describe("summarizeValuation", () => {
  it("summarizes the property, the figures and the amenities for the lead message", () => {
    const text = summarizeValuation(request, ok);
    expect(text).toContain("Departamento en Concepción, 70 m² construidos (venta)");
    expect(text).toContain("3.000 UF");
    expect(text).toContain("7 comparables");
    expect(text).toContain("Amenidades: piscina, bodega.");
  });

  it("includes the construction year", () => {
    expect(summarizeValuation(request, ok)).toContain("Año de construcción: 2008.");
  });
});

describe("formatUf", () => {
  it("uses Chilean thousands separators and no decimals", () => {
    expect(formatUf(4820.4)).toBe("4.820 UF");
  });
});

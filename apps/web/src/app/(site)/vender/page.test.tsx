import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import SellPage, { metadata } from "./page";

vi.mock("@/components/home/sell-lead-form", () => ({ SellLeadForm: () => <form data-form="sell" /> }));
vi.mock("@/components/home/property-showcase-section", () => ({
  PropertyShowcaseSection: ({ title }: { title: string }) => <section>{title}</section>,
}));
vi.mock("@/components/properties/properties-fallback", () => ({
  PropertiesFallbackProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/lib/properties-server", () => ({ fetchPropertiesFallback: async () => ({}) }));
vi.mock("@/lib/published-count", () => ({ fetchPublishedCount: async () => 7 }));

describe("/vender", () => {
  it("has its own title, description and canonical", () => {
    expect(String(metadata.title)).toContain("Vender tu propiedad en Concepción");
    expect(metadata.alternates?.canonical).toBe("/vender");
  });

  it("presents the sale process, the form and the showcase", async () => {
    const html = renderToStaticMarkup(await SellPage());
    expect(html).toContain("<h1");
    expect(html).toContain("Tasamos tu propiedad");
    expect(html).toContain("Cerramos la venta");
    expect(html).toContain("Fotografía profesional y publicación en portales inmobiliarios");
    expect(html).toContain('data-form="sell"');
    expect(html).toContain("¿Quieres vender tu propiedad?");
    expect(html).toContain('id="vender-form"');
    expect(html).toContain("Quiero vender");
    expect(html).toContain('href="#vender-form"');
    expect(html).toContain("Así mostramos lo que vendemos");
    expect(html).toContain('href="/regularizacion"');
    expect(html).toContain("application/ld+json");
  });

  it("states only checkable facts (published count, communes, free valuation)", async () => {
    const html = renderToStaticMarkup(await SellPage());
    expect(html).toContain("propiedades publicadas hoy");
    expect(html).toContain("costo de la tasación");
    expect(html).not.toMatch(/estrellas|premio|opiniones en Google/i);
  });
});

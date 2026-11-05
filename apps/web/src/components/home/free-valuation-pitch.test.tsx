import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COMMUNE_NAMES } from "@/lib/communes";
import { FreeValuationPitch } from "./free-valuation-pitch";

describe("FreeValuationPitch", () => {
  const html = renderToStaticMarkup(<FreeValuationPitch />);
  const text = html.replace(/<[^>]+>/g, "");

  it("states the free valuation, the reassurance and the regularization service, without unverifiable figures", () => {
    expect(text).toContain("Obtén tu tasación de venta o valoración de precio de arriendo profesional");
    expect(text).toContain("Sin gastar tiempo, sin perder dinero, sin letra chica, sin preocupaciones");
    expect(text).toContain("Asesoría en regularización de propiedades con problemas");
    expect(html).toContain('href="/regularizacion"');
    expect(text).not.toMatch(/\d+\+|años de experiencia|negocios realizados/);
    expect(text).toContain("Especializados en");
  });

  it("links houses and apartments to their valuation pages", () => {
    expect(html).toContain('href="/tasacion/casa/concepcion"');
    expect(html).toContain('href="/tasacion/departamento/concepcion"');
  });

  it("limits the offer to the communes of the selector", () => {
    expect(text).toContain(`* Aplica solamente para las comunas de ${COMMUNE_NAMES.join(", ")}.`);
  });

  it("holds the valuation form and is reachable by its anchor", () => {
    expect(html).toContain('id="tasacion-gratis"');
    expect(html).toContain('id="pitch-lead-address"');
    expect(html).toContain("Tasar gratis");
  });
});

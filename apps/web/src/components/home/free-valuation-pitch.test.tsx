import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COMMUNE_NAMES } from "@/lib/communes";
import { FreeValuationPitch } from "./free-valuation-pitch";

describe("FreeValuationPitch", () => {
  const html = renderToStaticMarkup(<FreeValuationPitch />);
  const text = html.replace(/<[^>]+>/g, "");

  it("states the free valuation, the reassurance and the credentials", () => {
    expect(text).toContain("Obtén tu tasación de venta o valoración de precio de arriendo profesional");
    expect(text).toContain("Sin gastar tiempo, sin perder dinero, sin letra chica, sin preocupaciones");
    expect(text).toContain("14+");
    expect(text).toContain("500+");
    expect(text).toContain("1.000+");
    expect(text).toContain("Especializados en");
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

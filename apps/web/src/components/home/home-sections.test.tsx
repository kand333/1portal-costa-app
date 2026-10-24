import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COVERAGE_COMMUNES } from "@/lib/communes";
import { CommuneDial } from "./commune-dial";
import { FaqSection } from "./faq-section";
import { LeadForm } from "./lead-form";
import { LeadSteps } from "./lead-steps";

describe("home lead capture", () => {
  it("renders the valuation form first, with the commune options and a way to switch to search", () => {
    const html = renderToStaticMarkup(<LeadForm source="home-hero" idPrefix="hero-lead" />);
    expect(html).toContain("Dirección o sector de la propiedad");
    expect(html).toContain("Tasar gratis");
    expect(html).toContain("Busco una propiedad");
    for (const commune of COVERAGE_COMMUNES) expect(html).toContain(commune.name);
    expect(html).toContain('id="hero-lead-address"');
  });

  it("renders one button per commune on the dial, none pressed before any choice", () => {
    const html = renderToStaticMarkup(<CommuneDial />);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(COVERAGE_COMMUNES.length);
    expect(html).toContain('id="cobertura"');
  });

  it("keeps the chapters readable in the server HTML", () => {
    expect(renderToStaticMarkup(<LeadSteps />)).toContain("Un precio pedido no es un precio pagado");
    const faq = renderToStaticMarkup(<FaqSection />);
    expect(faq).toContain("¿La tasación es gratis?");
    expect(faq).toContain("no reemplaza una tasación bancaria");
  });
});

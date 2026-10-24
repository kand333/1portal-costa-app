import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PropertyValuationPage from "./page";

describe("PropertyValuationPage", () => {
  it("shows the heading, the estimator fields, the map area and the FAQ", () => {
    const html = renderToStaticMarkup(<PropertyValuationPage />);
    expect(html).toContain("Tasación de propiedades gratis y online");
    for (const label of [
      "Dirección de la propiedad",
      "Comuna",
      "¿Qué tipo de propiedad es?",
      "¿Qué precio quieres conocer?",
      "Superficie total en m² (estimada)",
      "Superficie construida en m² (estimada)",
      "Número de dormitorios",
      "Número de baños",
      "Número de estacionamientos",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("Preguntas frecuentes");
    // The amenities step only appears after the data step.
    expect(html).not.toContain("Amenidades de la propiedad");
    expect(html.match(/<details/g)).toHaveLength(3);
  });

  it("keeps «Continuar» disabled until the data is complete", () => {
    const html = renderToStaticMarkup(<PropertyValuationPage />);
    expect(html).toMatch(/<button type="submit" disabled=""[^>]*>Continuar<\/button>/);
  });

  it("offers dormitories and bathrooms from 1 to 6+ and parking from 0 to 5+", () => {
    const html = renderToStaticMarkup(<PropertyValuationPage />);
    expect(html).toContain('aria-label="Número de dormitorios: 6+"');
    expect(html).not.toContain('aria-label="Número de dormitorios: 0"');
    expect(html).toContain('aria-label="Número de estacionamientos: 0"');
    expect(html).toContain('aria-label="Número de estacionamientos: 5+"');
  });
});

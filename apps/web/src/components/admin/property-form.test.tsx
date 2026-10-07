import type { AdminPropertyDetail } from "@portal/shared/admin-property";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PropertyForm } from "./property-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const property = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Casa en Ñuñoa",
  description: "Casa familiar con jardín.",
  operationType: "RENT",
  propertyType: "APARTMENT",
  price: 1450.5,
  currency: "CLP",
  usableArea: 80,
  totalArea: null,
  bedrooms: 2,
  bathrooms: 1,
  parkingSpaces: 0,
  ageInYears: null,
  address: "Av. Prueba 1",
  commune: "Ñuñoa",
  city: "Santiago",
  region: "Región Metropolitana",
  features: ["piscina", "Quincho", "Vista al lago"],
  isPublished: true,
  isFeatured: false,
} as AdminPropertyDetail;

describe("PropertyForm", () => {
  it("has every field of the spec, and no latitude or longitude", () => {
    const html = renderToStaticMarkup(<PropertyForm property={null} />);
    for (const label of [
      "Título",
      "Descripción",
      "Operación",
      "Tipo",
      "Precio (CLP)",
      "Superficie útil",
      "Superficie total",
      "Dormitorios",
      "Baños",
      "Estacionamientos",
      "Antigüedad",
      "Dirección",
      "Comuna",
      "Ciudad",
      "Región",
      "Otra característica",
      "Publicada",
      "Destacada",
    ]) {
      expect(html, label).toContain(label);
    }
    expect(html).not.toMatch(/latitud|longitud|latitude|longitude/i);
    expect(html).toContain("Crear propiedad");
  });

  it("starts empty and unpublished for a new property", () => {
    const html = renderToStaticMarkup(<PropertyForm property={null} />);
    expect(html).toMatch(/id="property-title"[^>]*value=""/);
    expect(html).not.toContain("checked");
    // The twelve common features, all unchecked; no chips.
    expect(html.match(/type="checkbox"/g)).toHaveLength(12 + 2);
    expect(html).toContain("(0 de 30)");
    expect(html).not.toContain("Quitar «");
  });

  it("is filled with the stored property when editing", () => {
    const html = renderToStaticMarkup(<PropertyForm property={property} />);
    expect(html).toContain('value="Casa en Ñuñoa"');
    expect(html).toContain('value="1450.5"');
    expect(html).toMatch(/<option value="RENT" selected="">Arriendo<\/option>/);
    expect(html).toMatch(/<option value="APARTMENT" selected="">Departamento<\/option>/);
    expect(html).toMatch(/id="property-parkingSpaces"[^>]*value="0"/);
    expect(html).toMatch(/id="property-totalArea"[^>]*value=""/);
    expect(html).toMatch(/name="isPublished" checked=""/);
    // Stored features are checked (ignoring case); one outside the common list gets its own checkbox.
    const checked = [...html.matchAll(/<input id="property-feature-\d+" type="checkbox"[^>]*checked=""\/><span[^>]*>([^<]+)<\/span>/g)].map(
      (match) => match[1],
    );
    expect(checked).toEqual(["Piscina", "Quincho", "Vista al lago"]);
    expect(html).toContain("(3 de 30)");
    expect(html).toContain("Guardar cambios");
  });

  it("only lets unchecking once 30 features are marked", () => {
    const features = Array.from({ length: 30 }, (_, index) => `Característica ${index}`);
    const html = renderToStaticMarkup(<PropertyForm property={{ ...property, features }} />);
    expect(html).toContain("(30 de 30)");
    // The 12 common ones are unchecked and disabled; the 30 marked stay enabled.
    expect(html.match(/type="checkbox" disabled=""/g)).toHaveLength(12);
    expect(html).toMatch(/id="property-features"[^>]*disabled=""/);
  });

  it("adds the catalog's features after the common ones, without repeating a name", () => {
    const html = renderToStaticMarkup(<PropertyForm property={null} catalog={["Sauna", "piscina", "Gimnasio"]} />);
    // 12 common + Sauna + Gimnasio («piscina» is the common «Piscina»), plus the two publication switches.
    expect(html.match(/type="checkbox"/g)).toHaveLength(12 + 2 + 2);
    expect(html.indexOf(">Conserjería</span>")).toBeLessThan(html.indexOf(">Sauna</span>"));
  });
});

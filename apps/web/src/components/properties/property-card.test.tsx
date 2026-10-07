import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PropertySummary } from "@portal/shared/property";
import { PropertyCard } from "./property-card";

const property: PropertySummary = {
  id: "5eed0000-0000-4000-8000-000000000003",
  title: "Departamento familiar frente a Apoquindo",
  operationType: "RENT",
  propertyType: "APARTMENT",
  price: 1380000,
  currency: "CLP",
  usableArea: 95,
  totalArea: 105,
  bedrooms: 3,
  bathrooms: 2,
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
  isFeatured: true,
  mainImageUrl: "https://images.unsplash.com/photo-1?auto=format",
  createdAt: "2026-09-16T12:00:00.000Z",
};

describe("PropertyCard", () => {
  it("shows the price, title, type, location and operation, linking to the detail", () => {
    const html = renderToStaticMarkup(<PropertyCard property={property} />);

    expect(html).toContain("$1.380.000 /mes");
    expect(html).toContain(property.title);
    expect(html).toContain("Departamento");
    expect(html).toContain("Las Condes, Santiago");
    expect(html).toContain("Arriendo");
    expect(html).toContain(`href="/properties/${property.id}"`);
  });

  it("describes the image with a meaningful alt text", () => {
    const html = renderToStaticMarkup(<PropertyCard property={property} />);
    expect(html).toContain(`alt="Departamento en Las Condes, Santiago: ${property.title}"`);
  });

  it("shows bedrooms, bathrooms and usable area as a labelled list", () => {
    const html = renderToStaticMarkup(<PropertyCard property={property} />);

    expect(html).toContain('aria-label="Características principales"');
    expect(html).toContain("3 dormitorios");
    expect(html).toContain("2 baños");
    expect(html).toContain("95 m² útiles");
  });

  it("shows only the total area for land and hides the list when nothing applies", () => {
    const land = { ...property, propertyType: "LAND" as const, bedrooms: null, bathrooms: null, usableArea: null, totalArea: 5000 };
    const landHtml = renderToStaticMarkup(<PropertyCard property={land} />);
    expect(landHtml).toContain("5.000 m² totales");
    expect(landHtml).not.toContain("dormitorio");

    const bare = { ...land, totalArea: null };
    expect(renderToStaticMarkup(<PropertyCard property={bare} />)).not.toContain("Características principales");
  });

  it("shows a placeholder when the property has no image", () => {
    const html = renderToStaticMarkup(<PropertyCard property={{ ...property, mainImageUrl: null }} />);
    expect(html).not.toContain("<img");
    expect(html).toContain("Sin fotografía");
  });
});

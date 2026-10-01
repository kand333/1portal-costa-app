import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PropertySummary } from "@portal/shared/property";
import { PropertyCard } from "./property-card";

const property: PropertySummary = {
  id: "5eed0000-0000-4000-8000-000000000003",
  title: "Departamento familiar frente a Apoquindo",
  operationType: "RENT",
  propertyType: "APARTMENT",
  price: 1450,
  currency: "USD",
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

    expect(html).toContain("US$1.450 /mes");
    expect(html).toContain(property.title);
    expect(html).toContain("Departamento · Las Condes, Santiago");
    expect(html).toContain("Arriendo");
    expect(html).toContain(`href="/properties/${property.id}"`);
  });

  it("describes the image with a meaningful alt text", () => {
    const html = renderToStaticMarkup(<PropertyCard property={property} />);
    expect(html).toContain(`alt="Departamento en Las Condes, Santiago: ${property.title}"`);
  });

  it("shows a placeholder when the property has no image", () => {
    const html = renderToStaticMarkup(<PropertyCard property={{ ...property, mainImageUrl: null }} />);
    expect(html).not.toContain("<img");
    expect(html).toContain("Sin fotografía");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PropertySummary } from "@portal/shared/property";
import { PropertyCard } from "./property-card";
import { UfValueProvider } from "./uf-value-context";

const property: PropertySummary = {
  id: "5eed0000-0000-4000-8000-000000000003",
  code: 5888,
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

  it("labels rentals in blue and sales in orange, in the top-left corner", () => {
    const rent = renderToStaticMarkup(<PropertyCard property={property} />);
    expect(rent).toMatch(/class="absolute left-4 top-4[^"]*bg-brand-blue[^"]*">Arriendo</);
    const sale = renderToStaticMarkup(<PropertyCard property={{ ...property, operationType: "SALE" }} />);
    expect(sale).toMatch(/class="absolute left-4 top-4[^"]*bg-accent[^"]*">En venta</);
  });

  it("describes the image with a meaningful alt text", () => {
    const html = renderToStaticMarkup(<PropertyCard property={property} />);
    expect(html).toContain(`alt="Departamento en Las Condes, Santiago: ${property.title}"`);
  });

  it("shows bedrooms, bathrooms and area in three boxes", () => {
    const html = renderToStaticMarkup(<PropertyCard property={property} />);

    expect(html).toContain('aria-label="Características principales"');
    expect(html).toContain("3 dorm.");
    expect(html).toContain("2 baños");
    expect(html).toContain("95 m²");
    expect(html).toContain("grid-cols-3");
  });

  it("shows the location in orange and, when the sector is recognised, «(sector …)» in the normal colour", () => {
    const plain = renderToStaticMarkup(<PropertyCard property={property} />);
    expect(plain).toContain('text-brass-text">Las Condes, Santiago</span>');
    expect(plain).not.toContain("(sector");
    const withSector = renderToStaticMarkup(<PropertyCard property={{ ...property, sector: "Centro" }} />);
    expect(withSector).toContain('text-brass-text">Las Condes, Santiago</span> (sector Centro)');
  });

  it("shows the listing code under the location", () => {
    expect(renderToStaticMarkup(<PropertyCard property={property} />)).toContain("Cód. 5888");
  });

  it("shows sales in UF, big and bold, with the price in pesos beside it", () => {
    const sale = { ...property, operationType: "SALE" as const, price: 89_900_000 };
    const html = renderToStaticMarkup(
      <UfValueProvider value={41_400}>
        <PropertyCard property={sale} />
      </UfValueProvider>,
    );
    expect(html).toMatch(/font-bold[^>]*>UF 2\.171<\/span><span[^>]*>\$89\.900\.000</);
  });

  it("falls back to pesos when today's UF is unknown, and never converts rentals", () => {
    const sale = { ...property, operationType: "SALE" as const, price: 89_900_000 };
    const withoutUf = renderToStaticMarkup(<PropertyCard property={sale} />);
    expect(withoutUf).toContain("$89.900.000");
    expect(withoutUf).not.toContain("UF ");
    const rent = renderToStaticMarkup(
      <UfValueProvider value={41_400}>
        <PropertyCard property={property} />
      </UfValueProvider>,
    );
    expect(rent).toContain("$1.380.000 /mes");
    expect(rent).not.toContain("UF ");
  });

  it("shows only the total area for land and hides the list when nothing applies", () => {
    const land = { ...property, propertyType: "LAND" as const, bedrooms: null, bathrooms: null, usableArea: null, totalArea: 5000 };
    const landHtml = renderToStaticMarkup(<PropertyCard property={land} />);
    expect(landHtml).toContain("5.000 m²");
    expect(landHtml).not.toContain("dorm.");
    expect(landHtml).toContain("grid-cols-1");

    const bare = { ...land, totalArea: null };
    expect(renderToStaticMarkup(<PropertyCard property={bare} />)).not.toContain("Características principales");
  });

  it("shows a placeholder when the property has no image", () => {
    const html = renderToStaticMarkup(<PropertyCard property={{ ...property, mainImageUrl: null }} />);
    expect(html).not.toContain("<img");
    expect(html).toContain("Sin fotografía");
  });
});

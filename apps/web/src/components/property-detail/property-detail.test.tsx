import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PropertyDetail as PropertyDetailData } from "@portal/shared/property";
import { PropertyDetail } from "./property-detail";

const property: PropertyDetailData = {
  id: "5eed0000-0000-4000-8000-000000000001",
  title: "Casa mediterránea con piscina",
  description: "Amplia casa familiar.\nJardín con piscina.",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 890000,
  currency: "USD",
  usableArea: 320,
  totalArea: 650,
  bedrooms: 5,
  bathrooms: 4,
  parkingSpaces: 3,
  ageInYears: 8,
  address: "Camino La Dehesa 1234",
  commune: "Lo Barnechea",
  city: "Santiago",
  region: "Región Metropolitana",
  isFeatured: true,
  features: ["Piscina", "Quincho"],
  images: [
    { id: "image-2", url: "https://images.unsplash.com/photo-2", position: 1, isMain: false },
    { id: "image-1", url: "https://images.unsplash.com/photo-1", position: 0, isMain: true },
  ],
  createdAt: "2026-09-16T12:00:00.000Z",
  updatedAt: "2026-09-17T12:00:00.000Z",
};

const render = (overrides: Partial<PropertyDetailData> = {}) =>
  renderToStaticMarkup(<PropertyDetail property={{ ...property, ...overrides }} />);

describe("PropertyDetail", () => {
  it("shows the title as the page heading, the price and the description", () => {
    const html = render();
    expect(html).toMatch(/<h1[^>]*>Casa mediterránea con piscina<\/h1>/);
    expect(html).toContain("US$890.000");
    expect(html).toContain("Amplia casa familiar.\nJardín con piscina.");
  });

  it("shows the full data sheet", () => {
    const html = render();
    for (const text of [
      "Operación",
      "Venta",
      "Casa",
      "Superficie útil",
      "320 m²",
      "Superficie total",
      "650 m²",
      "Dormitorios",
      "Baños",
      "Estacionamientos",
      "Antigüedad",
      "8 años",
    ]) {
      expect(html, text).toContain(text);
    }
  });

  it("lists the features and the full address", () => {
    const html = render();
    expect(html).toContain("Piscina");
    expect(html).toContain("Quincho");
    expect(html).toContain("Camino La Dehesa 1234, Lo Barnechea, Santiago, Región Metropolitana");
  });

  it("shows the main image with a descriptive alt text", () => {
    const html = render();
    expect(html).toContain("photo-1");
    expect(html).not.toContain("photo-2");
    expect(html).toContain('alt="Casa en Lo Barnechea, Santiago: Casa mediterránea con piscina"');
  });

  it("falls back to the first image, or to a placeholder without photos", () => {
    expect(render({ images: [property.images[0]] })).toContain("photo-2");
    expect(render({ images: [] })).toContain("Sin fotografía");
  });

  it("hides the features section when there are none", () => {
    expect(render({ features: [] })).not.toContain("Características");
  });

  it("links back to the catalog", () => {
    expect(render()).toContain('href="/properties"');
  });
});

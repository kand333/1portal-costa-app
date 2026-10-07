import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PropertyDetail as PropertyDetailData } from "@portal/shared/property";
import type { MapLocation } from "@/lib/property-location";
import { PropertyDetail } from "./property-detail";

const property: PropertyDetailData = {
  id: "5eed0000-0000-4000-8000-000000000001",
  title: "Casa mediterránea con piscina",
  description: "Amplia casa familiar.\nJardín con piscina.",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 846000000,
  currency: "CLP",
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

const render = (overrides: Partial<PropertyDetailData> = {}, mapLocation: MapLocation | null = null) =>
  renderToStaticMarkup(<PropertyDetail property={{ ...property, ...overrides }} mapLocation={mapLocation} />);

describe("PropertyDetail", () => {
  it("shows the title as the page heading, the price and the description", () => {
    const html = render();
    expect(html).toMatch(/<h1[^>]*>Casa mediterránea con piscina<\/h1>/);
    expect(html).toContain("$846 millones");
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

  it("shows the photo gallery, starting with the main photo", () => {
    const html = render();
    expect(html).toContain('aria-label="Galería de fotos"');
    expect(html).toContain('alt="Casa en Lo Barnechea, Santiago: Casa mediterránea con piscina. Foto 1 de 2"');
  });

  it("hides the features section when there are none", () => {
    expect(render({ features: [] })).not.toContain("Características");
  });

  it("shows the map of the geocoded property", () => {
    expect(render({}, { latitude: -33.35, longitude: -70.52, zoom: 17 })).toContain("Cargando mapa…");
    expect(render()).not.toContain("Cargando mapa");
  });

  it("links the address, in blue, to Google Maps in a new tab", () => {
    const html = render();
    const googleMapsHref =
      "https://www.google.com/maps/search/?api=1&amp;query=Camino+La+Dehesa+1234%2C+Lo+Barnechea%2C+Santiago%2C+Regi%C3%B3n+Metropolitana%2C+Chile";
    expect(html).toMatch(
      new RegExp(`<a href="${googleMapsHref.replace(/[.?+]/g, "\\$&")}" target="_blank" rel="noopener noreferrer" class="text-blue-700[^"]*">Camino La Dehesa 1234, Lo Barnechea`),
    );
  });

  it("links back to the catalog", () => {
    expect(render()).toContain('href="/properties"');
  });
});

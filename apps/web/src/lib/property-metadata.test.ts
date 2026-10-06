import type { PropertyDetail } from "@portal/shared/property";
import { describe, expect, it } from "vitest";
import { buildPropertyMetadata, toShareImageUrl, truncateDescription } from "./property-metadata";

const property: PropertyDetail = {
  id: "5eed0000-0000-4000-8000-000000000001",
  title: "Casa con piscina en Lo Barnechea",
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
  address: "Camino Los Trapenses 1234",
  commune: "Lo Barnechea",
  city: "Santiago",
  region: "Región Metropolitana",
  isFeatured: true,
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-02T12:00:00.000Z",
  description: "Amplia casa familiar\n\ncon piscina temperada, quincho y vista a la cordillera. ".repeat(4),
  features: ["Piscina"],
  images: [
    { id: "a", url: "https://res.cloudinary.com/demo/image/upload/second.jpg", position: 1, isMain: false },
    { id: "b", url: "https://res.cloudinary.com/demo/image/upload/main.jpg", position: 2, isMain: true },
  ],
};

describe("truncateDescription", () => {
  it("collapses whitespace and keeps short texts as they are", () => {
    expect(truncateDescription("  Casa\n\namplia  ")).toBe("Casa amplia");
  });

  it("cuts long texts at a word boundary, within the limit, ending with an ellipsis", () => {
    const result = truncateDescription("palabra ".repeat(40));
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result).toMatch(/palabra…$/);
  });
});

const mainShareUrl = "https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/main.jpg";

describe("toShareImageUrl", () => {
  it("asks Cloudinary for a 1200×630 JPEG", () => {
    expect(toShareImageUrl("https://res.cloudinary.com/demo/image/upload/main.jpg")).toBe(mainShareUrl);
  });

  it("crops the Unsplash placeholders to 1200×630 JPEG", () => {
    const url = new URL(toShareImageUrl("https://images.unsplash.com/photo-1?auto=format&fit=crop&w=1600&q=80"));
    expect(Object.fromEntries(url.searchParams)).toEqual({ fit: "crop", w: "1200", q: "80", h: "630", fm: "jpg" });
  });
});

describe("buildPropertyMetadata", () => {
  it("builds the title and a description that leads with the key facts", () => {
    const metadata = buildPropertyMetadata(property);
    expect(metadata.title).toBe("Casa con piscina en Lo Barnechea | Portal Inmobiliario");
    expect(metadata.description).toMatch(/^Casa en venta · US\$890\.000 · Lo Barnechea, Santiago\. Amplia casa familiar con piscina/);
    expect(metadata.description?.length).toBeLessThanOrEqual(160);
  });

  it("adds the canonical URL and Open Graph / Twitter with the main image", () => {
    const metadata = buildPropertyMetadata(property);
    expect(metadata.alternates?.canonical).toBe(`/properties/${property.id}`);
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Portal Inmobiliario",
      locale: "es_CL",
      url: `/properties/${property.id}`,
      title: metadata.title,
      description: metadata.description,
      images: [{ url: mainShareUrl, width: 1200, height: 630, alt: property.title }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: [mainShareUrl] });
  });

  it("falls back to the first image in order, and to no image at all", () => {
    const firstInOrder = buildPropertyMetadata({ ...property, images: property.images.map((image) => ({ ...image, isMain: false })) });
    expect(firstInOrder.openGraph?.images).toMatchObject([{ url: expect.stringMatching(/\/upload\/c_fill,[^/]+\/second\.jpg$/) }]);

    const withoutImages = buildPropertyMetadata({ ...property, images: [] });
    expect(withoutImages.openGraph?.images).toBeUndefined();
    expect(withoutImages.twitter).toMatchObject({ card: "summary" });
  });

  it("shows monthly rent prices", () => {
    expect(buildPropertyMetadata({ ...property, operationType: "RENT", price: 1200 }).description).toMatch(/^Casa en arriendo · US\$1\.200 \/mes/);
  });
});

import type { PropertySummary } from "@portal/shared/property";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyGrid, PropertyGridSkeleton } from "./property-grid";

const buildProperty = (id: string, title: string): PropertySummary => ({
  id,
  title,
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 100000,
  currency: "USD",
  usableArea: 100,
  totalArea: 200,
  bedrooms: 3,
  bathrooms: 2,
  commune: "Ñuñoa",
  city: "Santiago",
  region: "Región Metropolitana",
  isFeatured: false,
  mainImageUrl: null,
  createdAt: "2026-09-01T00:00:00.000Z",
});

describe("PropertyGrid", () => {
  it("renders one list item with a card per property, in order", () => {
    const html = renderToStaticMarkup(
      <PropertyGrid properties={[buildProperty("a", "Primera casa"), buildProperty("b", "Segunda casa")]} />,
    );

    expect(html.startsWith("<ul")).toBe(true);
    expect(html.match(/<li>/g)).toHaveLength(2);
    expect(html.indexOf("Primera casa")).toBeLessThan(html.indexOf("Segunda casa"));
  });

  it("waits for wide screens before a third column when next to a sidebar", () => {
    const html = renderToStaticMarkup(<PropertyGrid properties={[buildProperty("a", "Casa")]} layout="withSidebar" />);
    expect(html).toContain("xl:grid-cols-3");
    expect(html).not.toContain("lg:grid-cols-3");
  });

  it("uses a responsive grid: 1 column on phones, 2 on tablets, 3 on desktop", () => {
    const html = renderToStaticMarkup(<PropertyGrid properties={[buildProperty("a", "Casa")]} />);
    for (const className of ["grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3"]) {
      expect(html).toContain(className);
    }
  });
});

describe("PropertyGridSkeleton", () => {
  it("renders the requested number of placeholders inside an announced status region", () => {
    const html = renderToStaticMarkup(<PropertyGridSkeleton count={4} label="Cargando propiedades" />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Cargando propiedades"');
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(4);
  });
});

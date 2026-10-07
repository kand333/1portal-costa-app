import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyResults } from "./property-results";

const property: PropertySummary = {
  id: "5eed0000-0000-4000-8000-000000000001",
  title: "Casa de prueba",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 100000,
  currency: "CLP",
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
};

const page = (items: PropertySummary[]): PaginatedResponse<PropertySummary> => ({
  data: items,
  meta: { page: 1, pageSize: 12, total: items.length, totalPages: items.length ? 1 : 0 },
});

const baseProps = {
  data: undefined,
  error: undefined,
  isLoading: false,
  onRetry: () => {},
  skeletonCount: 3,
  loadingLabel: "Cargando propiedades",
  emptyMessage: "Aún no hay propiedades.",
};

describe("PropertyResults", () => {
  it("shows an announced skeleton while loading", () => {
    const html = renderToStaticMarkup(<PropertyResults {...baseProps} isLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Cargando propiedades"');
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(3);
  });

  it("shows an alert with a retry button on error", () => {
    const html = renderToStaticMarkup(<PropertyResults {...baseProps} error={new Error("Error interno del servidor")} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Error interno del servidor");
    expect(html).toContain("Reintentar");
  });

  it("shows the empty message when there are no properties", () => {
    const html = renderToStaticMarkup(<PropertyResults {...baseProps} data={page([])} />);
    expect(html).toContain("Aún no hay propiedades.");
    expect(html).not.toContain("<article");
  });

  it("renders the properties in a grid", () => {
    const html = renderToStaticMarkup(<PropertyResults {...baseProps} data={page([property])} />);
    expect(html).toContain("Casa de prueba");
    expect(html.match(/<article/g)).toHaveLength(1);
  });

  it("renders nothing before the first response", () => {
    expect(renderToStaticMarkup(<PropertyResults {...baseProps} />)).toBe("");
  });
});

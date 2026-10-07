import type { AdminPropertySummary } from "@portal/shared/admin-property";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminPropertyList } from "./admin-property-list";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const property = (overrides: Partial<AdminPropertySummary>): AdminPropertySummary => ({
  id: "11111111-1111-4111-8111-111111111111",
  title: "Casa en Ñuñoa",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 250000,
  currency: "CLP",
  usableArea: 120,
  totalArea: 200,
  bedrooms: 3,
  bathrooms: 2,
  commune: "Ñuñoa",
  city: "Santiago",
  region: "Región Metropolitana",
  isFeatured: false,
  mainImageUrl: null,
  createdAt: "2026-09-01T12:00:00.000Z",
  isPublished: true,
  updatedAt: "2026-09-15T12:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const draft = property({ id: "22222222-2222-4222-8222-222222222222", title: "Depto borrador", isPublished: false, isFeatured: true });

const render = (
  data: AdminPropertySummary[],
  meta = { page: 1, pageSize: 12, total: data.length, totalPages: 1 },
  search = "",
  status: "active" | "deleted" = "active",
  cities = [{ slug: "santiago", name: "Santiago" }],
) => renderToStaticMarkup(<AdminPropertyList result={{ data, meta }} params={{ page: meta.page, search, status }} cities={cities} />);

describe("AdminPropertyList", () => {
  it("lists published and unpublished properties with their status", () => {
    const html = render([property({}), draft]);
    expect(html).toContain("Casa en Ñuñoa");
    expect(html).toContain("Depto borrador");
    expect(html).toContain(">Publicada<");
    expect(html).toContain(">Sin publicar<");
    expect(html).toContain(">Destacada<");
    expect(html).toContain("2 propiedades");
  });

  it("links to create and edit, and to the public page only when published", () => {
    const html = render([property({}), draft]);
    expect(html).toContain('href="/admin/properties/new"');
    expect(html).toContain(`href="/admin/properties/${draft.id}/edit"`);
    expect(html).toContain('href="/properties/11111111-1111-4111-8111-111111111111"');
    expect(html).not.toContain(`href="/properties/${draft.id}"`);
    expect(html).toContain("aria-label=\"Eliminar «Depto borrador»\"");
  });

  it("keeps the search in the form and in the page links", () => {
    const html = render([property({})], { page: 1, pageSize: 1, total: 3, totalPages: 3 }, "ñuñoa");
    expect(html).toContain('value="ñuñoa"');
    expect(html).toContain("3 propiedades para «ñuñoa»");
    expect(html).toContain('href="/admin/properties?search=%C3%B1u%C3%B1oa&amp;page=2"');
    expect(html).toContain("Limpiar búsqueda");
  });

  it("explains an empty result", () => {
    expect(render([])).toContain("Aún no hay propiedades. Crea la primera.");
    expect(render([], undefined, "xyz")).toContain("Ninguna propiedad coincide con la búsqueda o los filtros.");
    expect(render([], { page: 5, pageSize: 12, total: 3, totalPages: 1 })).toContain("No hay propiedades en esta página.");
  });

  it("has a collapsible filter panel with status, operation, type, city, price and creation date", () => {
    const html = render([property({})]);
    // Closed by default on narrow screens without filters in use (the server has no viewport).
    expect(html).toMatch(/<details class="group/);
    for (const label of ["Estado", "Operación", "Tipo de propiedad", "Ciudad", "Precio (CLP)", "Fecha de creación"]) {
      expect(html, label).toContain(`>${label}</`);
    }
    for (const option of ["Publicadas", "Borradores", "Eliminadas"]) expect(html).toContain(`>${option}</option>`);
    expect(html).toContain('<option value="santiago">Santiago</option>');
    expect(html).toContain('type="date"');
  });

  it("hides the city filter when no published property has a city", () => {
    expect(render([property({})], undefined, "", "active", [])).not.toContain(">Ciudad</label>");
  });

  it("keeps the filters in the search form and in «Limpiar búsqueda»", () => {
    const html = renderToStaticMarkup(
      <AdminPropertyList
        result={{ data: [property({})], meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 } }}
        params={{ page: 1, search: "casa", status: "draft", operation: "RENT", minPrice: 500 }}
        cities={[]}
      />,
    );
    expect(html).toContain('<input type="hidden" name="status" value="draft"/>');
    expect(html).toContain('<input type="hidden" name="operation" value="RENT"/>');
    expect(html).toContain('href="/admin/properties?status=draft&amp;operation=RENT&amp;minPrice=500"');
    // Three filters in use, counted on the panel.
    expect(html).toMatch(/Filtros<span[^>]*>3<\/span>/);
    expect(html).toContain("Limpiar filtros");
    // Open when filters are in use.
    expect(html).toContain("<details open=\"\"");
  });

  it("shows deleted properties read only, with the deletion date", () => {
    const deleted = property({ title: "Casa eliminada", deletedAt: "2026-10-03T15:30:00.000Z" });
    const html = render([deleted], undefined, "", "deleted");
    expect(html).toContain(">Eliminada el</dt>");
    expect(html).toContain('dateTime="2026-10-03T15:30:00.000Z"');
    expect(html).toContain("1 propiedad eliminada");
    expect(html).not.toContain("Editar");
    expect(html).not.toContain("Eliminar «");
    expect(html).not.toContain(">Publicada<");
    expect(html).toContain('<input type="hidden" name="status" value="deleted"/>');
    expect(html).toContain('<option value="deleted" selected="">Eliminadas</option>');
  });
});

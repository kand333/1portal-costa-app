import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFilterOptions } from "@/hooks/use-filter-options";
import type { CatalogFilters } from "@/lib/catalog-filters";
import { CatalogFiltersPanel } from "./catalog-filters-panel";

let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/properties",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));
vi.mock("@/hooks/use-filter-options", () => ({ useFilterOptions: vi.fn() }));

const options = {
  regions: [{ slug: "region-metropolitana", name: "Región Metropolitana" }],
  cities: [{ slug: "santiago", name: "Santiago" }],
  communes: [
    { slug: "las-condes", name: "Las Condes" },
    { slug: "nunoa", name: "Ñuñoa" },
    { slug: "providencia", name: "Providencia" },
  ],
};

const mockOptions = (result: Partial<ReturnType<typeof useFilterOptions>>) =>
  vi.mocked(useFilterOptions).mockReturnValue({
    data: undefined,
    error: undefined,
    isLoading: false,
    ...result,
  } as ReturnType<typeof useFilterOptions>);

const render = (filters: CatalogFilters, isOpen = true) =>
  renderToStaticMarkup(
    <CatalogFiltersPanel filters={filters} isOpen={isOpen} onToggle={() => {}} closeAfterApply={false} />,
  );

describe("CatalogFiltersPanel", () => {
  beforeEach(() => {
    currentSearch = "";
    mockOptions({ data: options });
  });

  it("renders a labelled field for every single-value filter", () => {
    const html = render({});
    for (const id of [
      "filter-type",
      "filter-city",
      "filter-region",
      "filter-minPrice",
      "filter-maxPrice",
      "filter-bedrooms",
      "filter-bathrooms",
      "filter-minUsableArea",
    ]) {
      expect(html, id).toContain(`for="${id}"`);
      expect(html, id).toContain(`id="${id}"`);
    }
    expect(html).toContain('aria-label="Filtros del catálogo"');
  });

  it("offers the operations, property types and room minimums in Spanish", () => {
    const html = render({});
    for (const text of ["Venta", "Arriendo", "Casa", "Departamento", "Terreno", "Oficina", "Local comercial", "3+"]) {
      expect(html, text).toContain(text);
    }
  });

  it("lists the communes as labelled checkboxes using slugs as values", () => {
    const html = render({});

    expect(html).toMatch(/<legend[^>]*>Comuna/);
    expect(html).toMatch(/type="checkbox"[^>]*name="commune" value="providencia"/);
    expect(html).toMatch(/for="filter-commune-nunoa"[^>]*>Ñuñoa<\/label>/);
    expect(html).not.toMatch(/<select[^>]*name="commune"/);
  });

  it("offers city and region as single-choice selects", () => {
    const html = render({ region: ["region-metropolitana"] });

    expect(html).toMatch(/<select id="filter-city" name="city"/);
    expect(html).toMatch(/<select id="filter-region" name="region"/);
    expect(html).toMatch(/<option value="region-metropolitana" selected="">Región Metropolitana<\/option>/);
    expect(html).not.toMatch(/type="checkbox"[^>]*name="(region|city)"/);
  });

  it("places commune, city and region last, in that order", () => {
    const html = render({});
    const commune = html.indexOf("filter-commune-");
    const city = html.indexOf('id="filter-city"');
    const region = html.indexOf('id="filter-region"');

    expect(commune).toBeGreaterThan(html.indexOf('id="filter-minUsableArea"'));
    expect(commune).toBeLessThan(city);
    expect(city).toBeLessThan(region);
  });

  it("offers sale and rent as separate checkboxes, both checked when no operation is filtered", () => {
    const html = render({});

    expect(html).toMatch(/<legend[^>]*>Operación/);
    expect(html).toMatch(/id="filter-operation-SALE"[^>]*checked=""/);
    expect(html).toMatch(/id="filter-operation-RENT"[^>]*checked=""/);
    expect(html).toMatch(/for="filter-operation-SALE"[^>]*>Venta<\/label>/);
    expect(html).toMatch(/for="filter-operation-RENT"[^>]*>Arriendo<\/label>/);
    expect(html).not.toMatch(/<select[^>]*name="operation"/);
  });

  it("checks only the filtered operation", () => {
    const html = render({ operation: "RENT" });
    expect(html).toMatch(/id="filter-operation-RENT"[^>]*checked=""/);
    expect(html).not.toMatch(/id="filter-operation-SALE"[^>]*checked=""/);
  });

  it("checks every selected location and shows how many are selected", () => {
    const html = render({ commune: ["las-condes", "providencia"] });

    expect(html).toMatch(/id="filter-commune-las-condes"[^>]*checked=""/);
    expect(html).toMatch(/id="filter-commune-providencia"[^>]*checked=""/);
    expect(html).not.toMatch(/id="filter-commune-nunoa"[^>]*checked=""/);
    expect(html).toContain("(2 seleccionadas)");
  });

  it("shows the active single-value filters as selected values", () => {
    const html = render({ type: "APARTMENT", minPrice: 500, bedrooms: 2 });

    expect(html).toMatch(/<option value="APARTMENT" selected="">/);
    expect(html).toMatch(/<option value="2" selected="">2\+<\/option>/);
    expect(html).toContain('value="500"');
  });

  it("keeps a selected location that is not among the options", () => {
    expect(render({ commune: ["atlantida"] })).toMatch(/id="filter-commune-atlantida"[^>]*checked=""/);
  });

  it("offers to clear the filters only when some are active, keeping the search", () => {
    expect(render({})).not.toContain("Limpiar filtros");

    currentSearch = "search=casa&commune=nunoa&commune=providencia&page=2";
    const html = render({ commune: ["nunoa", "providencia"] });
    expect(html).toContain("Limpiar filtros");
    expect(html).toContain('href="/properties?search=casa"');
  });

  it("has a toggle, on every screen size, that announces each active choice", () => {
    const html = render({ type: "HOUSE", commune: ["nunoa", "providencia"] });

    expect(html).toMatch(/<button type="button" aria-expanded="true" aria-controls="catalog-filters"/);
    expect(html).not.toMatch(/<button[^>]*lg:hidden/);
    // Read by screen readers as "3 filtros activos": 1 type + 2 communes.
    expect(html).toContain('3<span class="sr-only"> filtros activos</span>');
  });

  it("hides the form when folded", () => {
    const html = render({}, false);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Mostrar filtros");
    expect(html).toMatch(/<form id="catalog-filters"[^>]*hidden=""/);
  });

  it("shows that the locations are loading and explains when they cannot be loaded", () => {
    mockOptions({ isLoading: true });
    expect(render({})).toContain("Cargando…");

    mockOptions({ error: new Error("fail") });
    expect(render({})).toContain("No pudimos cargar las ubicaciones disponibles.");
  });
});

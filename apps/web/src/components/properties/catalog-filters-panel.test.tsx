import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogFilters } from "@/lib/catalog-filters";
import { CatalogFiltersPanel } from "./catalog-filters-panel";

let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/properties",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const render = (filters: CatalogFilters) => renderToStaticMarkup(<CatalogFiltersPanel filters={filters} />);

/** The `<select>` element with this id, to check its options in isolation. */
const selectHtml = (html: string, id: string) => html.match(new RegExp(`<select id="${id}"[\\s\\S]*?</select>`))?.[0] ?? "";

describe("CatalogFiltersPanel", () => {
  beforeEach(() => {
    currentSearch = "";
  });

  it("renders a labelled field for every single-value filter", () => {
    const html = render({});
    for (const id of [
      "filter-city",
      "filter-commune",
      "filter-region",
      "filter-type",
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
    for (const text of ["En venta", "Arriendo", "Casa", "Departamento", "Terreno", "Oficina", "Local comercial", "3+"]) {
      expect(html, text).toContain(text);
    }
  });

  it("puts the main filters in the top bar and the rest under «Más filtros»", () => {
    const html = render({});
    const order = [
      "Operación",
      'id="filter-city"',
      'id="filter-type"',
      'id="filter-maxPrice"',
      'id="filter-bedrooms"',
      "Más filtros",
      'id="filter-region"',
      'id="filter-commune"',
      'id="filter-minPrice"',
    ].map(
      (marker) => html.indexOf(marker),
    );

    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((first, second) => first - second)).toEqual(order);
  });

  it("offers the ten communes of Gran Concepción as a single-choice select called «Comuna», with slugs as values", () => {
    const html = render({});
    const city = selectHtml(html, "filter-city");

    expect(html).toMatch(/for="filter-city"[^>]*>\s*Comuna\s*</);
    expect(html).not.toMatch(/for="filter-city"[^>]*>\s*Ciudad/);

    expect(city).toMatch(/<option value="" selected="">Todas<\/option>/);
    for (const [slug, name] of [
      ["concepcion", "Concepción"],
      ["san-pedro-de-la-paz", "San Pedro de la Paz"],
      ["chiguayante", "Chiguayante"],
      ["hualpen", "Hualpén"],
      ["talcahuano", "Talcahuano"],
      ["penco", "Penco"],
      ["tome", "Tomé"],
      ["hualqui", "Hualqui"],
      ["coronel", "Coronel"],
      ["lota", "Lota"],
    ]) {
      expect(city, name).toContain(`<option value="${slug}">${name}</option>`);
    }
    expect(city.match(/<option /g)).toHaveLength(11);
  });

  it("calls the sector field «Sector» and keeps it off until a commune is chosen", () => {
    const html = render({});
    const sector = selectHtml(html, "filter-commune");

    expect(html).toMatch(/for="filter-commune"[^>]*>\s*Sector\s*</);
    expect(sector).toMatch(/<select[^>]* disabled=""/);
    expect(sector).toContain("Elige una comuna");
  });

  it("lists the fifteen sectors of Concepción once that city is chosen", () => {
    const sector = selectHtml(render({ city: ["concepcion"] }), "filter-commune");

    expect(sector).not.toMatch(/<select[^>]* disabled=""/);
    expect(sector).toContain('<option value="centro-de-concepcion">Centro de Concepción</option>');
    expect(sector).toContain('<option value="pedro-de-valdivia">Pedro de Valdivia</option>');
    expect(sector).toContain('<option value="valle-andalien">Valle Andalién</option>');
    expect(sector.match(/<option /g)).toHaveLength(16);
  });

  it("selects the filtered sector", () => {
    const sector = selectHtml(render({ city: ["concepcion"], commune: ["collao"] }), "filter-commune");
    expect(sector).toMatch(/<option value="collao" selected="">Collao<\/option>/);
  });

  it("shows «Próximamente» for the cities that have no sector list yet", () => {
    const sector = selectHtml(render({ city: ["talcahuano"] }), "filter-commune");

    expect(sector).toMatch(/<select[^>]* disabled=""/);
    expect(sector).toContain("Próximamente");
  });

  it("titles the region field «Región del Bío-Bío» with two options: Gran Concepción (default) and Provincia de Arauco", () => {
    const html = render({});
    const region = selectHtml(html, "filter-region");

    expect(html).toMatch(/for="filter-region"[^>]*>\s*Región del Bío-Bío\s*</);
    expect(region).toMatch(/<option value="region-del-biobio" selected="">Gran Concepción<\/option>/);
    expect(region).toContain('<option value="provincia-arauco">Provincia de Arauco</option>');
    expect(region.match(/<option /g)).toHaveLength(2);
  });

  it("lists the seven communes of Arauco when that province is chosen", () => {
    const html = render({ region: ["provincia-arauco"] });
    const city = selectHtml(html, "filter-city");

    expect(selectHtml(html, "filter-region")).toMatch(/<option value="provincia-arauco" selected="">Provincia de Arauco<\/option>/);
    expect(city).toContain('<option value="canete">Cañete</option>');
    expect(city).toContain('<option value="lebu">Lebu</option>');
    expect(city).not.toContain("Concepción");
    expect(city.match(/<option /g)).toHaveLength(8);
  });

  it("offers sale and rent as separate checkboxes, both checked when no operation is filtered", () => {
    const html = render({});

    expect(html).toMatch(/<legend[^>]*>Operación/);
    expect(html).toMatch(/id="filter-operation-SALE"[^>]*checked=""/);
    expect(html).toMatch(/id="filter-operation-RENT"[^>]*checked=""/);
    expect(html).toMatch(/for="filter-operation-SALE"[^>]*>En venta<\/label>/);
    expect(html).toMatch(/for="filter-operation-RENT"[^>]*>Arriendo<\/label>/);
    expect(html).not.toMatch(/<select[^>]*name="operation"/);
  });

  it("checks only the filtered operation", () => {
    const html = render({ operation: "RENT" });
    expect(html).toMatch(/id="filter-operation-RENT"[^>]*checked=""/);
    expect(html).not.toMatch(/id="filter-operation-SALE"[^>]*checked=""/);
  });

  it("shows the active single-value filters as selected values", () => {
    const html = render({ type: "APARTMENT", minPrice: 500, bedrooms: 2 });

    expect(html).toMatch(/<option value="APARTMENT" selected="">/);
    expect(html).toMatch(/<option value="2" selected="">2\+<\/option>/);
    expect(html).toContain('value="500"');
  });

  it("keeps a selected city or sector that is not among the options", () => {
    expect(selectHtml(render({ city: ["atlantida"] }), "filter-city")).toMatch(/<option value="atlantida" selected="">atlantida<\/option>/);
    expect(selectHtml(render({ city: ["concepcion"], commune: ["atlantida"] }), "filter-commune")).toMatch(
      /<option value="atlantida" selected="">atlantida<\/option>/,
    );
  });

  it("offers to clear the filters only when some are active, keeping the search", () => {
    expect(render({})).not.toContain("Limpiar filtros");

    currentSearch = "search=casa&commune=nunoa&commune=providencia&page=2";
    const html = render({ commune: ["nunoa", "providencia"] });
    expect(html).toContain("Limpiar filtros");
    expect(html).toContain('href="/properties?search=casa"');
  });

  it("does not count the default region as an active filter", () => {
    expect(render({ region: ["region-del-biobio"] })).not.toContain("Limpiar filtros");
    expect(render({ region: ["provincia-arauco"] })).toContain("Limpiar filtros");
  });

  it("always shows the form, with no outer «Mostrar filtros» toggle", () => {
    const html = render({});
    expect(html).not.toContain("Mostrar filtros");
    expect(html).not.toContain("Ocultar filtros");
    expect(html).not.toMatch(new RegExp('<form id="catalog-filters"[^>]*hidden=""'));
  });

  it("keeps operation and comuna in view on phones and folds type, maximum price and bedrooms under «Más filtros»", () => {
    const html = render({});
    const wrapper = (id: string) => html.match(new RegExp('<div class="([^"]*)"><label for="' + id + '"'))?.[1] ?? "";
    for (const id of ["filter-type", "filter-maxPrice", "filter-bedrooms"]) expect(wrapper(id), id).toContain("max-lg:hidden");
    expect(html).toMatch(new RegExp('<div><label for="filter-city"'));
    expect(html).toContain('id="filter-operation-SALE"');
  });

  it("shows those folded filters on phones once «Más filtros» is open because a secondary filter is active", () => {
    const html = render({ bathrooms: 2 });
    expect(html.match(new RegExp('<div class="([^"]*)"><label for="filter-type"'))).toBeNull();
    expect(html).toContain("Menos filtros");
  });

  it("puts operation and comuna on one line on phones", () => {
    const html = render({});
    const wrapper = html.indexOf("grid-cols-[auto_minmax(0,1fr)]");
    expect(wrapper).toBeGreaterThan(0);
    expect(wrapper).toBeLessThan(html.indexOf("filter-operation-SALE"));
    expect(html.indexOf("filter-operation-SALE")).toBeLessThan(html.indexOf('id="filter-city"'));
    expect(html.indexOf('id="filter-city"')).toBeLessThan(html.indexOf('id="filter-type"'));
    expect(html).toContain('<option value="" selected="">Todas</option>');
  });

  it("has no «Buscar» while «Más filtros» is folded, and only desktop shows it once it is open", () => {
    const folded = render({});
    expect(folded).not.toContain("Buscar");
    expect(folded).not.toContain('type="submit"');
    const open = render({ bathrooms: 2 });
    expect(open).toContain("Buscar");
    // Only from `lg`: on phones nothing needs the button, every field applies on its own.
    expect(open.match(new RegExp('<button type="submit" class="([^"]*)"'))?.[1]).toContain("max-lg:hidden");
    expect(open.indexOf("Buscar")).toBeGreaterThan(open.indexOf('id="filter-minUsableArea"'));
  });

  it("gives the Operación and Comuna titles the same fixed height so they line up", () => {
    const html = render({});
    expect(html).toMatch(new RegExp('<legend class="[^"]*h-5[^"]*">Operación'));
    expect(html).toMatch(new RegExp('for="filter-city" class="[^"]*h-5'));
  });

  it("announces the active filters hidden under «Más filtros» on phones", () => {
    const html = render({ type: "HOUSE", commune: ["nunoa", "providencia"], city: ["concepcion"], operation: "RENT" });
    // 1 type + 2 sectors; the operation and the comuna are always in view, so they are not counted here.
    expect(html).toContain('3<span class="sr-only"> filtros activos</span>');
    expect(html).toMatch(new RegExp('Más filtros|Menos filtros'));
  });
});

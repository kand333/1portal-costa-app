import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProperties } from "@/hooks/use-properties";
import { PropertyCatalog } from "./property-catalog";

let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/properties",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));
vi.mock("@/hooks/use-properties", () => ({ useProperties: vi.fn() }));
vi.mock("@/hooks/use-filter-options", () => ({
  useFilterOptions: () => ({ data: { regions: [], cities: [], communes: [] }, error: undefined, isLoading: false }),
}));

const buildProperty = (index: number): PropertySummary => ({
  id: `5eed0000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  title: `Propiedad ${index}`,
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

const response = (items: PropertySummary[], page: number, total: number): PaginatedResponse<PropertySummary> => ({
  data: items,
  meta: { page, pageSize: 12, total, totalPages: Math.ceil(total / 12) },
});

const mockResult = (result: Partial<ReturnType<typeof useProperties>>) =>
  vi.mocked(useProperties).mockReturnValue({
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
    ...result,
  } as ReturnType<typeof useProperties>);

describe("PropertyCatalog", () => {
  beforeEach(() => {
    currentSearch = "";
    vi.mocked(useProperties).mockReset();
  });

  it("requests the first page with 12 items by default", () => {
    mockResult({ isLoading: true });
    renderToStaticMarkup(<PropertyCatalog />);
    expect(useProperties).toHaveBeenCalledWith({ page: 1, pageSize: 12, search: undefined, sort: undefined });
  });

  it.each([
    ["page=3", 3],
    ["page=abc", 1],
    ["page=0", 1],
    ["page=-2", 1],
  ])("reads the page from the URL (%s -> %i)", (search, expectedPage) => {
    currentSearch = search;
    mockResult({ isLoading: true });
    renderToStaticMarkup(<PropertyCatalog />);
    expect(useProperties).toHaveBeenCalledWith({ page: expectedPage, pageSize: 12, search: undefined, sort: undefined });
  });

  it("shows the loading skeleton", () => {
    mockResult({ isLoading: true });
    const html = renderToStaticMarkup(<PropertyCatalog />);
    expect(html).toContain('aria-label="Cargando propiedades"');
    expect(html).not.toContain("Paginación");
  });

  it("shows the API error with a retry button", () => {
    mockResult({ error: new Error("Error interno del servidor") });
    const html = renderToStaticMarkup(<PropertyCatalog />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Error interno del servidor");
    expect(html).toContain("Reintentar");
  });

  it("shows the empty state when no property is published", () => {
    mockResult({ data: response([], 1, 0) });
    const html = renderToStaticMarkup(<PropertyCatalog />);
    expect(html).toContain("Aún no hay propiedades publicadas.");
    expect(html).not.toContain("Paginación");
  });

  it("shows the properties, the total and the pagination", () => {
    mockResult({ data: response(Array.from({ length: 12 }, (_, index) => buildProperty(index + 1)), 1, 18) });
    const html = renderToStaticMarkup(<PropertyCatalog />);

    expect(html.match(/<article/g)).toHaveLength(12);
    expect(html).toContain("18 propiedades");
    expect(html).toContain("Página 1 de 2");
    expect(html).toContain('aria-label="Paginación"');
  });

  it("uses the singular for a single property and omits the page counter", () => {
    mockResult({ data: response([buildProperty(1)], 1, 1) });
    const html = renderToStaticMarkup(<PropertyCatalog />);
    expect(html).toContain("1 propiedad");
    expect(html).not.toContain("1 propiedades");
    expect(html).not.toContain("Página 1 de 1");
  });

  it("explains an out-of-range page and keeps the pagination to go back", () => {
    currentSearch = "page=99";
    mockResult({ data: response([], 99, 18) });
    const html = renderToStaticMarkup(<PropertyCatalog />);

    expect(html).toContain("Esta página no existe");
    expect(html).not.toContain("18 propiedades");
    expect(html).toContain('aria-label="Paginación"');
    expect(html).toContain('href="/properties"');
  });

  describe("search", () => {
    it("passes the search from the URL to the API, trimmed", () => {
      currentSearch = "search=%20Las%20Condes%20&page=2";
      mockResult({ isLoading: true });
      renderToStaticMarkup(<PropertyCatalog />);
      expect(useProperties).toHaveBeenCalledWith({ page: 2, pageSize: 12, search: "Las Condes", sort: undefined });
    });

    it("shows a labelled search field with the active search and a way to clear it", () => {
      currentSearch = "search=providencia";
      mockResult({ data: response([buildProperty(1)], 1, 1) });
      const html = renderToStaticMarkup(<PropertyCatalog />);

      expect(html).toContain('role="search"');
      expect(html).toContain('for="catalog-search"');
      expect(html).toContain('value="providencia"');
      expect(html).toContain("Limpiar búsqueda");
      expect(html).toContain('href="/properties"');
    });

    it("does not offer to clear when there is no search", () => {
      mockResult({ data: response([buildProperty(1)], 1, 1) });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain('role="search"');
      expect(html).not.toContain("Limpiar búsqueda");
    });

    it("includes the search in the results summary", () => {
      currentSearch = "search=providencia";
      mockResult({ data: response([buildProperty(1), buildProperty(2)], 1, 2) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).toContain("2 propiedades para «providencia»");
    });

    it("explains when nothing matches the search", () => {
      currentSearch = "search=zzz";
      mockResult({ data: response([], 1, 0) });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain("No encontramos propiedades que coincidan con «zzz»");
      expect(html).not.toContain("Aún no hay propiedades publicadas.");
    });

    it("keeps the search when changing page", () => {
      currentSearch = "search=casa";
      mockResult({ data: response(Array.from({ length: 12 }, (_, index) => buildProperty(index + 1)), 1, 18) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).toContain('href="/properties?search=casa&amp;page=2"');
    });

    it("escapes the search text when rendering", () => {
      currentSearch = "search=%3Cscript%3Ealert(1)%3C%2Fscript%3E";
      mockResult({ data: response([], 1, 0) });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("filters", () => {
    it("sends the filters of the URL to the API together with the search and page", () => {
      currentSearch = "operation=SALE&type=HOUSE&minPrice=100000&bedrooms=3&commune=las-condes&search=casa&page=2";
      mockResult({ isLoading: true });
      renderToStaticMarkup(<PropertyCatalog />);

      expect(useProperties).toHaveBeenCalledWith({
        operation: "SALE",
        type: "HOUSE",
        minPrice: 100000,
        bedrooms: 3,
        commune: ["las-condes"],
        page: 2,
        pageSize: 12,
        search: "casa",
        sort: undefined,
      });
    });

    it("sends several selected communes to the API", () => {
      currentSearch = "commune=las-condes&commune=providencia";
      mockResult({ isLoading: true });
      renderToStaticMarkup(<PropertyCatalog />);
      expect(useProperties).toHaveBeenCalledWith(
        expect.objectContaining({ commune: ["las-condes", "providencia"] }),
      );
    });

    it("keeps several communes when changing page", () => {
      currentSearch = "commune=las-condes&commune=providencia";
      mockResult({ data: response(Array.from({ length: 12 }, (_, index) => buildProperty(index + 1)), 1, 18) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).toContain(
        'href="/properties?commune=las-condes&amp;commune=providencia&amp;page=2"',
      );
    });

    it("uses the full width for the results while the filters are folded", () => {
      // Without a browser viewport the filters start folded.
      mockResult({ data: response([buildProperty(1)], 1, 1) });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain("lg:grid-cols-3");
      expect(html).not.toContain("lg:grid-cols-[17rem_minmax(0,1fr)]");
    });

  it("does not send invalid filters from an edited URL", () => {
      currentSearch = "operation=BUY&minPrice=-1&commune=las condes";
      mockResult({ isLoading: true });
      renderToStaticMarkup(<PropertyCatalog />);
      expect(useProperties).toHaveBeenCalledWith({ page: 1, pageSize: 12, search: undefined, sort: undefined });
    });

    it("renders the filters panel next to the results", () => {
      mockResult({ data: response([buildProperty(1)], 1, 1) });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain('aria-label="Filtros"');
      expect(html).toContain('aria-label="Filtros del catálogo"');
    });

    it("mentions the filters in the summary", () => {
      currentSearch = "type=HOUSE";
      mockResult({ data: response([buildProperty(1), buildProperty(2)], 1, 2) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).toContain("2 propiedades con los filtros aplicados");
    });

    it("suggests removing filters when nothing matches", () => {
      currentSearch = "type=LAND&search=playa";
      mockResult({ data: response([], 1, 0) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).toContain(
        "No encontramos propiedades con estos filtros para «playa». Prueba quitando alguno.",
      );
    });

    it("keeps the filters when changing page", () => {
      currentSearch = "operation=RENT&bedrooms=2";
      mockResult({ data: response(Array.from({ length: 12 }, (_, index) => buildProperty(index + 1)), 1, 18) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).toContain('href="/properties?operation=RENT&amp;bedrooms=2&amp;page=2"');
    });
  });

  describe("sort order", () => {
    it("sends the sort order of the URL to the API", () => {
      currentSearch = "sort=price-asc&search=casa";
      mockResult({ isLoading: true });
      renderToStaticMarkup(<PropertyCatalog />);
      expect(useProperties).toHaveBeenCalledWith(expect.objectContaining({ sort: "price-asc", search: "casa" }));
    });

    it("ignores an unknown sort order from an edited URL", () => {
      currentSearch = "sort=cheapest";
      mockResult({ isLoading: true });
      renderToStaticMarkup(<PropertyCatalog />);
      expect(useProperties).toHaveBeenCalledWith(expect.objectContaining({ sort: undefined }));
    });

    it("shows the sort select with the active order next to the results summary", () => {
      currentSearch = "sort=area-desc";
      mockResult({ data: response([buildProperty(1)], 1, 1) });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain('id="catalog-sort"');
      expect(html).toMatch(/<option value="area-desc" selected="">Superficie: mayor a menor<\/option>/);
    });

    it("keeps the sort order when changing page", () => {
      currentSearch = "sort=price-desc";
      mockResult({ data: response(Array.from({ length: 12 }, (_, index) => buildProperty(index + 1)), 1, 18) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).toContain('href="/properties?sort=price-desc&amp;page=2"');
    });

    it("hides the sort select when no property matches", () => {
      mockResult({ data: response([], 1, 0) });
      expect(renderToStaticMarkup(<PropertyCatalog />)).not.toContain('id="catalog-sort"');
    });
  });

  describe("refreshing results", () => {
    it("dims the previous results and marks them busy while new ones load", () => {
      mockResult({ data: response([buildProperty(1)], 1, 1), isValidating: true });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("opacity-60");
      expect(html).toContain("Propiedad 1");
    });

    it("is not busy when the results are up to date", () => {
      mockResult({ data: response([buildProperty(1)], 1, 1), isValidating: false });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain('aria-busy="false"');
      expect(html).not.toContain("opacity-60");
    });

    it("keeps showing the previous results, not placeholders, when SWR reports loading with previous data", () => {
      // SWR sets isLoading while a new key loads even if the previous data is still returned.
      mockResult({ data: response([buildProperty(1)], 1, 1), isLoading: true, isValidating: true });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain("Propiedad 1");
      expect(html).not.toContain('aria-label="Cargando propiedades"');
      expect(html).toContain('aria-busy="true"');
    });

    it("shows the placeholders only on the first load, when there is nothing to keep", () => {
      mockResult({ isLoading: true, isValidating: true });
      const html = renderToStaticMarkup(<PropertyCatalog />);
      expect(html).toContain('aria-label="Cargando propiedades"');
      expect(html).not.toContain("opacity-60");
    });
  });
});

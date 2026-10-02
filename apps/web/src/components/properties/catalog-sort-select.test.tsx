import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CatalogSortSelect } from "./catalog-sort-select";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/properties",
  useSearchParams: () => new URLSearchParams(""),
}));

describe("CatalogSortSelect", () => {
  it("is a labelled select with every order in Spanish", () => {
    const html = renderToStaticMarkup(<CatalogSortSelect sort={undefined} />);

    expect(html).toContain('for="catalog-sort"');
    expect(html).toContain('id="catalog-sort"');
    for (const text of [
      "Más recientes",
      "Precio: menor a mayor",
      "Precio: mayor a menor",
      "Superficie: menor a mayor",
      "Superficie: mayor a menor",
    ]) {
      expect(html, text).toContain(text);
    }
  });

  it("selects the newest order when none is chosen", () => {
    expect(renderToStaticMarkup(<CatalogSortSelect sort={undefined} />)).toMatch(
      /<option value="newest" selected="">Más recientes<\/option>/,
    );
  });

  it("selects the active order", () => {
    const html = renderToStaticMarkup(<CatalogSortSelect sort="price-desc" />);
    expect(html).toMatch(/<option value="price-desc" selected="">Precio: mayor a menor<\/option>/);
    expect(html).not.toMatch(/<option value="newest" selected="">/);
  });
});

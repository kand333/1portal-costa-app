import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { HeroSection } from "./hero-section";
import { ShortcutTiles } from "./shortcut-tiles";

describe("home shortcuts", () => {
  it("shows the search by commune and type, the result count and the two services in the hero", () => {
    const html = renderToStaticMarkup(<HeroSection resultCount={22} />);
    expect(html).toContain("Encuentra tu hogar ideal en el Gran Concepción");
    expect(html).toContain('role="search"');
    expect(html).toContain("Se han encontrado 22 resultados");
    expect(html).toContain('href="/#tasacion-gratis"');
    expect(html).toContain('href="/#cierre"');
  });

  it("omits the result count when the API cannot answer", () => {
    expect(renderToStaticMarkup(<HeroSection resultCount={null} />)).not.toContain("Se han encontrado");
  });

  it("renders one tile link per service under the hero", () => {
    const html = renderToStaticMarkup(<ShortcutTiles />);
    expect(html).toContain("Proyectos nuevos");
    expect(html).toContain("Tasación");
    expect(html).toContain("Corretaje tradicional");
  });
});

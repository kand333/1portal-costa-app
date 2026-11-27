import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { HeroSection } from "./hero-section";
import { ShortcutTiles } from "./shortcut-tiles";

describe("home shortcuts", () => {
  it("shows the search by commune only, the result count and the two buttons in the hero", () => {
    const html = renderToStaticMarkup(<HeroSection />);
    expect(html.replace(/<[^>]+>/g, "")).toContain("Encuentra tu hogar ideal en el Gran Concepción");
    expect(html).toContain('<em class="display-accent">Gran Concepción</em>');
    expect(html).toContain('role="search"');
    expect(html).toContain("Revisa Tu Ubicación");
    expect(html).not.toContain("Se han encontrado");
    expect(html).toContain('href="/properties?operation=SALE"');
    expect(html).toContain("Ver Propiedades");
    expect(html).toContain("hero-commune");
    expect(html).not.toContain("Ver resultados");
    expect(html).not.toContain("Tipo de propiedad");
    expect(html).not.toContain("Entrega inmediata");
    expect(html).not.toContain("Búsqueda avanzada");
    expect(html).toContain('href="/regularizacion"');
    expect(html).toContain("¿Quieres");
    expect(html).toContain("Regularizar?");
    expect(html).not.toContain("Equipo jurídico");
    expect(html).not.toContain('href="/tasador-propiedades"');
    expect(html).not.toContain("Corretaje tradicional");
  });

  it("renders one tile link per service under the hero (valuation lives in its own block)", () => {
    const html = renderToStaticMarkup(<ShortcutTiles />);
    expect(html).toContain("Proyectos nuevos");
    expect(html).not.toContain("Tasación");
    expect(html).toContain("Corretaje tradicional");
  });
});

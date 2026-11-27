import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CommuneProvider } from "./commune-context";
import { CommuneDial } from "./commune-dial";

vi.mock("@/components/home/commune-map-loader", () => ({ CommuneMap: () => null }));

describe("CommuneDial", () => {
  it("links «Propiedades Disponibles» to the catalog filtered by the chosen commune", () => {
    const html = renderToStaticMarkup(
      <CommuneProvider initialCommune="Concepción">
        <CommuneDial />
      </CommuneProvider>,
    );
    expect(html).toContain("Propiedades Disponibles");
    expect(html).toContain('href="/properties?city=concepcion"');
    expect(html).not.toContain("Tasar mi propiedad aquí");
  });
});

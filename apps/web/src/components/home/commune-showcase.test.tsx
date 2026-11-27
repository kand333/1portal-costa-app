import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommuneShowcase } from "./commune-showcase";
import { COMMUNE_NAMES } from "@/lib/communes";
import { COMMUNE_PROFILES } from "@/lib/commune-profiles";

describe("CommuneShowcase", () => {
  it("links «Ver Propiedades Disponibles» to the catalog filtered by the commune", () => {
    const html = renderToStaticMarkup(
      <CommuneShowcase name="Concepción" profile={COMMUNE_PROFILES["Concepción"]!} origin={{ x: 50, y: 50 }} names={COMMUNE_NAMES} onSelect={() => undefined} onClose={() => undefined} />,
    );
    expect(html).toContain("Ver Propiedades Disponibles");
    expect(html).toContain('href="/properties?city=concepcion"');
    expect(html).not.toContain("Tasar mi propiedad aquí");
  });
});

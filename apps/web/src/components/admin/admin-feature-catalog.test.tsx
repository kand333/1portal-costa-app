import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminFeatureCatalog } from "./admin-feature-catalog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const features = [
  { id: "f1", name: "Piscina", propertyCount: 3 },
  { id: "f2", name: "Sauna", propertyCount: 0 },
  { id: "f3", name: "Quincho", propertyCount: 1 },
];

describe("AdminFeatureCatalog", () => {
  it("lists every feature with its usage and a field to add one", () => {
    const html = renderToStaticMarkup(<AdminFeatureCatalog features={features} />);
    expect(html).toContain('<label for="new-feature" class="sr-only">Nueva característica</label>');
    expect(html).toContain("En 3 propiedades");
    expect(html).toContain("En 1 propiedad");
    expect(html).toContain("Sin uso");
    expect(html.match(/aria-label="Renombrar «/g)).toHaveLength(3);
  });

  it("only lets unused features be deleted", () => {
    const html = renderToStaticMarkup(<AdminFeatureCatalog features={features} />);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Eliminar «Piscina»"/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Eliminar «Quincho»"/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*aria-label="Eliminar «Sauna»"/);
    expect(html).toContain("Está en 3 propiedades: quítala de ellas antes de eliminarla");
  });

  it("explains an empty catalog", () => {
    expect(renderToStaticMarkup(<AdminFeatureCatalog features={[]} />)).toContain("Aún no hay características.");
  });
});

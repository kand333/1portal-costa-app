import type { ValuationCityDto } from "@portal/shared/valuation-sector";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { AdminValuationSectors } from "./admin-valuation-sectors";

const city: ValuationCityDto = {
  id: "0190f2d4-0000-7000-8000-000000000001",
  name: "Concepción",
  houseUfPerM2: 38,
  apartmentUfPerM2: 42,
  landUfPerM2: 7,
  updatedAt: "2026-11-26T12:00:00.000Z",
  sectors: [
    {
      id: "0190f2d4-0000-7000-8000-000000000002",
      cityId: "0190f2d4-0000-7000-8000-000000000001",
      name: "Pedro de Valdivia Alto",
      commune: "Concepción",
      latitude: -36.793,
      longitude: -73.027,
      coefficient: 1.3,
      note: "Revisar",
      source: "estimado",
      updatedAt: "2026-11-26T12:00:00.000Z",
    },
  ],
};
const emptyCity: ValuationCityDto = { ...city, id: "0190f2d4-0000-7000-8000-000000000003", name: "Penco", sectors: [] };

describe("AdminValuationSectors", () => {
  const html = renderToStaticMarkup(<AdminValuationSectors cities={[city, emptyCity]} />);

  it("explains what the table is and how many sectors a city should have", () => {
    expect(html).toContain("Tasación por sector");
    expect(html).toContain("más de 300 mil habitantes, 12 a 15");
  });

  it("shows each city with its base prices per type", () => {
    expect(html).toContain("Concepción");
    expect(html).toContain("Departamento (UF/m²)");
    expect(html).toContain('value="42"');
    expect(html).toContain('value="38"');
    expect(html).toContain('value="7"');
  });

  it("lists the sectors with an editable coefficient and the resulting UF per square meter", () => {
    expect(html).toContain("Pedro de Valdivia Alto");
    expect(html).toContain('value="1.3"');
    // 42 × 1.3 = 54.6 (apartment), 38 × 1.3 = 49.4 (house), 7 × 1.3 = 9.1 (land).
    expect(html).toContain("54,6");
    expect(html).toContain("49,4");
    expect(html).toContain("9,1");
  });

  it("says when a city has no sectors yet, and offers to add sectors and cities", () => {
    expect(html).toContain("Sin sectores");
    expect(html).toContain("Agregar sector a Penco");
    expect(html).toContain("Agregar ciudad");
  });
});

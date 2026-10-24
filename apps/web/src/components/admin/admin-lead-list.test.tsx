import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminLeadList } from "./admin-lead-list";

const lead = {
  id: "1",
  kind: "VALUATION",
  source: "home-hero",
  name: "María Pérez",
  email: "maria@correo.cl",
  phone: "+56 9 1234 5678",
  address: "Barros Arana 1000",
  commune: "Concepción",
  operation: null,
  propertyType: null,
  user: null,
  createdAt: "2026-10-23T12:00:00.000Z",
} as const;

describe("AdminLeadList", () => {
  it("shows each lead with its contact and detail", () => {
    const html = renderToStaticMarkup(
      <AdminLeadList result={{ data: [lead], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }} page={1} />,
    );
    expect(html).toContain("María Pérez");
    expect(html).toContain("mailto:maria@correo.cl");
    expect(html).toContain("Barros Arana 1000 · Concepción");
    expect(html).toContain("Tasación");
  });

  it("explains when there are no leads", () => {
    const html = renderToStaticMarkup(
      <AdminLeadList result={{ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }} page={1} />,
    );
    expect(html).toContain("Aún no hay solicitudes.");
  });
});

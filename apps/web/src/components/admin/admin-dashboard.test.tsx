import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminDashboard } from "./admin-dashboard";

const stats = {
  properties: { total: 1250, published: 1200, forSale: 900, forRent: 350 },
  users: 42,
  inquiries: 7,
};

describe("AdminDashboard", () => {
  it("shows the six indicators of the spec with Chilean number format", () => {
    const html = renderToStaticMarkup(<AdminDashboard stats={stats} />);
    for (const [label, value] of [
      ["Total", "1.250"],
      ["Publicadas", "1.200"],
      ["En venta", "900"],
      ["En arriendo", "350"],
      ["Usuarios", "42"],
      ["Consultas", "7"],
    ]) {
      expect(html, label).toMatch(new RegExp(`<dt[^>]*>${label}</dt><dd[^>]*>${value.replace(".", "\.")}</dd>`));
    }
  });

  it("links to the property management", () => {
    expect(renderToStaticMarkup(<AdminDashboard stats={stats} />)).toContain('href="/admin/properties"');
  });

  it("tells how many properties are not published", () => {
    expect(renderToStaticMarkup(<AdminDashboard stats={stats} />)).toContain("50 sin publicar");
    const one = { ...stats, properties: { ...stats.properties, published: 1249 } };
    expect(renderToStaticMarkup(<AdminDashboard stats={one} />)).toContain("1 sin publicar");
  });
});

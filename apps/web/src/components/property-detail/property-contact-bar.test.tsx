import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyContactBar } from "./property-contact-bar";

describe("PropertyContactBar", () => {
  it("is a phones-only bar with the price and the three ways to reach the executive", () => {
    const html = renderToStaticMarkup(
      <PropertyContactBar property={{ price: 89_900_000, currency: "CLP", operationType: "SALE", title: "Depto", code: 5888 }} />,
    );
    expect(html).toContain("lg:hidden");
    expect(html).toContain("$89.900.000");
    expect(html).toContain(">Llamar<");
    expect(html).toContain(">WhatsApp<");
    expect(html).toContain(">Agendar visita<");
    expect(html).toContain('href="tel:+56920593331"');
  });
});

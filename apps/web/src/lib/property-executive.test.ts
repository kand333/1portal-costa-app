import { describe, expect, it } from "vitest";
import { buildExecutiveCallUrl, buildExecutiveWhatsAppUrl, PROPERTY_EXECUTIVE } from "./property-executive";

describe("property executive", () => {
  it("is Felipe Smith, reachable at +56 9 2059 3331", () => {
    expect(PROPERTY_EXECUTIVE.name).toBe("Felipe Smith");
    expect(buildExecutiveCallUrl()).toBe("tel:+56920593331");
  });

  it("builds a WhatsApp link with the title and the code of the listing", () => {
    const url = new URL(buildExecutiveWhatsAppUrl({ title: "Depto en Concepción", code: 5888 }));
    expect(url.origin + url.pathname).toBe("https://wa.me/56920593331");
    expect(url.searchParams.get("text")).toContain("Depto en Concepción");
    expect(url.searchParams.get("text")).toContain("Cód. 5888");
  });
});

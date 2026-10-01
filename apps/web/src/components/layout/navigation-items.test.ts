import { describe, expect, it } from "vitest";
import { getActiveNavigationHref, navigationItems } from "./navigation-items";

describe("navigationItems", () => {
  it("exposes the public navigation in the specified order", () => {
    expect(navigationItems.map((item) => item.label)).toEqual([
      "Inicio",
      "Propiedades",
      "Comprar",
      "Arrendar",
      "Ingresar",
    ]);
  });
});

describe("getActiveNavigationHref", () => {
  it("marks home on the root path", () => {
    expect(getActiveNavigationHref("/", null)).toBe("/");
  });

  it("marks the catalog when no operation is selected", () => {
    expect(getActiveNavigationHref("/properties", null)).toBe("/properties");
  });

  it("marks buy and rent according to the operation parameter", () => {
    expect(getActiveNavigationHref("/properties", "SALE")).toBe("/properties?operation=SALE");
    expect(getActiveNavigationHref("/properties", "RENT")).toBe("/properties?operation=RENT");
  });

  it("falls back to the catalog for unknown operations", () => {
    expect(getActiveNavigationHref("/properties", "OTHER")).toBe("/properties");
  });

  it("marks the catalog on a property detail page", () => {
    expect(getActiveNavigationHref("/properties/abc", "SALE")).toBe("/properties");
  });

  it("marks login on the login page", () => {
    expect(getActiveNavigationHref("/login", null)).toBe("/login");
  });

  it("returns null for routes outside the public navigation", () => {
    expect(getActiveNavigationHref("/account", null)).toBeNull();
    expect(getActiveNavigationHref("/propertiesx", null)).toBeNull();
  });
});

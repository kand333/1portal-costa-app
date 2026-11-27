import { describe, expect, it } from "vitest";
import { getActiveNavigationHref, navigationItems } from "./navigation-items";

describe("navigationItems", () => {
  it("exposes the public navigation in the specified order", () => {
    expect(navigationItems.map((item) => item.label)).toEqual([
      "Inicio",
      "Propiedades",
      "Vender",
      "Tasar",
      "Regularizar",
      "Entrar a mi cuenta",
    ]);
  });
});

describe("getActiveNavigationHref", () => {
  it("marks «Inicio» on the home page", () => {
    expect(getActiveNavigationHref("/")).toBe("/");
  });

  it("marks «Propiedades» on the catalog and on a property page", () => {
    expect(getActiveNavigationHref("/properties")).toBe("/properties");
    expect(getActiveNavigationHref("/properties/abc")).toBe("/properties");
  });

  it("marks the sell page on its route", () => {
    expect(getActiveNavigationHref("/vender")).toBe("/vender");
  });

  it("marks the valuation page on its route", () => {
    expect(getActiveNavigationHref("/tasador-propiedades")).toBe("/tasador-propiedades");
  });

  it("marks the regularization page on its route", () => {
    expect(getActiveNavigationHref("/regularizacion")).toBe("/regularizacion");
  });

  it("marks login on the login page", () => {
    expect(getActiveNavigationHref("/login")).toBe("/login");
  });

  it("marks the account (the user name link) on the account pages", () => {
    expect(getActiveNavigationHref("/account")).toBe("/account");
    expect(getActiveNavigationHref("/account/favorites")).toBe("/account");
  });

  it("returns null for routes outside the public navigation", () => {
    expect(getActiveNavigationHref("/admin")).toBeNull();
    expect(getActiveNavigationHref("/propertiesx")).toBeNull();
  });
});

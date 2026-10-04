import { describe, expect, it } from "vitest";
import { adminNavigationItems, getActiveAdminSection } from "./admin-navigation";

describe("adminNavigationItems", () => {
  it("lists the four sections in the requested order", () => {
    expect(adminNavigationItems.map((item) => item.label)).toEqual([
      "Panel administración",
      "Administrar propiedades",
      "Consultas",
      "Mi cuenta",
    ]);
  });
});

describe("getActiveAdminSection", () => {
  it.each([
    ["/admin", "dashboard"],
    ["/admin/properties", "properties"],
    ["/admin/properties/new", "properties"],
    ["/admin/properties/11111111-1111-4111-8111-111111111111/edit", "properties"],
    ["/admin/inquiries", "inquiries"],
    ["/admin/inquiries/11111111-1111-4111-8111-111111111111", "inquiries"],
    ["/admin/account", "account"],
  ])("%s → %s", (pathname, section) => {
    expect(getActiveAdminSection(pathname)).toBe(section);
  });

  it("does not confuse a prefix with a section", () => {
    expect(getActiveAdminSection("/admin/propertiesx")).toBeNull();
    expect(getActiveAdminSection("/admin/unknown")).toBeNull();
  });
});

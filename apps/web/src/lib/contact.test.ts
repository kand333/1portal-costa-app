import { describe, expect, it } from "vitest";
import { formatWhatsAppNumber, getSocialLinks } from "./contact";

describe("formatWhatsAppNumber", () => {
  it("groups a Chilean mobile number", () => {
    expect(formatWhatsAppNumber("+56920593331")).toBe("+56 9 2059 3331");
    expect(formatWhatsAppNumber("56 9 2059-3331")).toBe("+56 9 2059 3331");
  });

  it("keeps other numbers as +digits and returns null without digits", () => {
    expect(formatWhatsAppNumber("+1 415 555 0100")).toBe("+14155550100");
    expect(formatWhatsAppNumber(undefined)).toBeNull();
    expect(formatWhatsAppNumber("sin número")).toBeNull();
  });
});

describe("getSocialLinks", () => {
  it("keeps only the networks with a valid https URL, in a fixed order", () => {
    const links = getSocialLinks({
      instagram: "https://www.instagram.com/propizoom",
      facebook: " https://www.facebook.com/propizoom ",
      youtube: "javascript:alert(1)",
    });
    expect(links.map((link) => link.network)).toEqual(["facebook", "instagram"]);
    expect(links[0].href).toBe("https://www.facebook.com/propizoom");
  });

  it("returns nothing when no URL is set", () => {
    expect(getSocialLinks({})).toEqual([]);
    expect(getSocialLinks({ facebook: "", youtube: "http://insecure.example" })).toEqual([]);
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WhatsAppButton, buildWhatsAppUrl } from "./whatsapp-button";

describe("buildWhatsAppUrl", () => {
  it("keeps only digits of the number and encodes the message", () => {
    expect(buildWhatsAppUrl("+56 9 1234 5678", "Hola, ¿qué tal?")).toBe(
      "https://wa.me/56912345678?text=Hola%2C+%C2%BFqu%C3%A9+tal%3F",
    );
  });

  it("returns null without digits", () => {
    expect(buildWhatsAppUrl(undefined, "Hola")).toBeNull();
    expect(buildWhatsAppUrl("  +- ", "Hola")).toBeNull();
  });
});

describe("WhatsAppButton", () => {
  it("renders an accessible new-tab link when a number is set", () => {
    const html = renderToStaticMarkup(<WhatsAppButton number="56912345678" />);
    expect(html).toContain('href="https://wa.me/56912345678?text=');
    expect(html).toContain('aria-label="Consultar por WhatsApp"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Asesoría personalizada");
  });

  it("renders nothing without a number", () => {
    expect(renderToStaticMarkup(<WhatsAppButton number="" />)).toBe("");
  });
});

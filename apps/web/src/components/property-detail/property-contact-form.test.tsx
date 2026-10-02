import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyContactForm } from "./property-contact-form";

const render = () =>
  renderToStaticMarkup(
    <PropertyContactForm propertyId="5eed0000-0000-4000-8000-000000000001" propertyTitle="Casa con piscina" />,
  );

describe("PropertyContactForm", () => {
  it("names the property the inquiry is about", () => {
    const html = render();
    expect(html).toContain("Solicitar información");
    expect(html).toContain("Sobre «Casa con piscina»");
  });

  it("has labelled name, email, phone and message fields with autocomplete", () => {
    const html = render();
    for (const [id, label] of [
      ["contact-name", "Nombre"],
      ["contact-email", "Email"],
      ["contact-phone", "Teléfono"],
      ["contact-message", "Mensaje"],
    ]) {
      expect(html, id).toMatch(new RegExp(`<label for="${id}"[^>]*>${label}`));
      expect(html, id).toContain(`id="${id}"`);
    }
    expect(html).toMatch(/type="email"[^>]*autoComplete="email"/);
    expect(html).toContain('autoComplete="name"');
    expect(html).toContain('autoComplete="tel"');
    expect(html).toContain("(opcional)");
  });

  it("validates in the browser with its own messages instead of the native bubbles", () => {
    expect(render()).toContain('<form noValidate=""');
  });

  it("hides a honeypot field from people and assistive technology", () => {
    const html = render();
    expect(html).toMatch(/<div aria-hidden="true" class="hidden">[^]*tabindex="-1"[^>]*name="botcheck"/);
  });

  it("starts ready to send, without errors", () => {
    const html = render();
    expect(html).toContain(">Enviar consulta</button>");
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain(" aria-invalid=");
  });
});

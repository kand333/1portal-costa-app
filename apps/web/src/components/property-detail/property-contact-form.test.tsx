import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PropertyContactForm, withUserContact } from "./property-contact-form";

vi.mock("@/hooks/use-current-user", () => ({ useCurrentUser: vi.fn() }));

const user = { id: "u1", name: "Ana García", email: "ana@test.com", role: "USER" as const, isActive: true };
const mockSession = (data: typeof user | null | undefined) =>
  vi.mocked(useCurrentUser).mockReturnValue({ data } as ReturnType<typeof useCurrentUser>);

beforeEach(() => mockSession(undefined));

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

  it("prefills name and email for a logged-in user, leaving phone and message empty and every field editable", () => {
    mockSession(user);
    const html = render();
    expect(html).toMatch(/id="contact-name"[^>]*value="Ana García"/);
    expect(html).toMatch(/id="contact-email"[^>]*value="ana@test.com"/);
    expect(html).toMatch(/id="contact-phone"[^>]*value=""/);
    expect(html).toMatch(/<textarea[^>]*id="contact-message"[^>]*><\/textarea>/);
    expect(html).not.toMatch(/ readOnly="| disabled="/);
  });

  it("keeps every field empty without a session", () => {
    for (const session of [undefined, null]) {
      mockSession(session);
      const html = render();
      expect(html).toMatch(/id="contact-name"[^>]*value=""/);
      expect(html).toMatch(/id="contact-email"[^>]*value=""/);
    }
  });
});

describe("withUserContact", () => {
  const empty = { name: "", email: "", phone: "", message: "" };

  it("fills only empty name and email, never phone or message", () => {
    expect(withUserContact(empty, user)).toEqual({ name: "Ana García", email: "ana@test.com", phone: "", message: "" });
    const typed = { name: "Ana", email: "otra@correo.cl", phone: "+56 9", message: "Hola" };
    expect(withUserContact(typed, user)).toEqual(typed);
  });

  it("changes nothing without a user", () => {
    expect(withUserContact(empty, null)).toBe(empty);
  });
});

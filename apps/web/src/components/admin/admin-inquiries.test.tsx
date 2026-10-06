import type { AdminInquiryDetail as AdminInquiryDetailData, AdminInquirySummary } from "@portal/shared/inquiry";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminInquiryDetail } from "./admin-inquiry-detail";
import { AdminInquiryList } from "./admin-inquiry-list";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const summary = (overrides: Partial<AdminInquirySummary> = {}): AdminInquirySummary => ({
  id: "11111111-1111-4111-8111-111111111111",
  propertyId: "22222222-2222-4222-8222-222222222222",
  propertyTitle: "Casa en Ñuñoa",
  isPropertyPublic: true,
  user: { id: "u1", name: "Ana García", email: "ana@test.com" },
  name: "Ana García",
  email: "ana@test.com",
  phone: "+56 9 1234 5678",
  message: "¿Sigue disponible?",
  createdAt: "2026-10-01T12:00:00.000Z",
  hiddenByUser: false,
  messageCount: 0,
  lastActivityAt: "2026-10-01T12:00:00.000Z",
  lastMessage: null,
  awaitingReply: true,
  ...overrides,
});

describe("AdminInquiryList", () => {
  const render = (data: AdminInquirySummary[], search = "") =>
    renderToStaticMarkup(
      <AdminInquiryList result={{ data, meta: { page: 1, pageSize: 12, total: data.length, totalPages: 1 } }} params={{ page: 1, search }} />,
    );

  it("shows date, property, contact, message and the answer status, linking to the conversation", () => {
    const html = render([summary(), summary({ id: "33333333-3333-4333-8333-333333333333", user: null, awaitingReply: false, messageCount: 2 })]);
    for (const header of ["Fecha", "Propiedad", "Contacto", "Mensaje", "Estado"]) expect(html).toContain(`>${header}</th>`);
    expect(html).toContain(">Sin responder<");
    expect(html).toContain(">Respondida<");
    expect(html).toContain("2 respuestas");
    expect(html).toContain("Usuario: Ana García");
    expect(html).toContain("Visitante");
    expect(html).toContain("+56 9 1234 5678");
    expect(html).toContain('href="/admin/inquiries/11111111-1111-4111-8111-111111111111"');
  });

  it("shows the last entry of each conversation with its author", () => {
    const html = render([
      summary({ lastMessage: { fromAdmin: false, body: "agendemos", createdAt: "2026-10-04T21:08:00.000Z" } }),
      summary({ id: "55555555-5555-4555-8555-555555555555", lastMessage: { fromAdmin: true, body: "Hola Ana", createdAt: "2026-10-04T21:07:00.000Z" } }),
      summary({ id: "66666666-6666-4666-8666-666666666666" }),
    ]);
    expect(html).toMatch(/Última entrada · <span[^>]*>Ana García<\/span>[^]*?agendemos/);
    expect(html).toMatch(/Última entrada · <span[^>]*>Portal<\/span>[^]*?Hola Ana/);
    expect(html.match(/Última entrada/g)).toHaveLength(2);
  });

  it("links the associated property while it is public", () => {
    const html = render([
      summary(),
      summary({ id: "44444444-4444-4444-8444-444444444444", propertyTitle: "Depto retirado", isPropertyPublic: false }),
    ]);
    expect(html).toMatch(/<a [^>]*href="\/properties\/22222222-2222-4222-8222-222222222222"[^>]*>Casa en Ñuñoa<\/a>/);
    expect(html).not.toMatch(/<a [^>]*>Depto retirado<\/a>/);
    expect(html).toContain("Ya no está publicada");
  });

  it("explains an empty list and an empty search", () => {
    expect(render([])).toContain("Aún no hay consultas.");
    expect(render([], "xyz")).toContain("Ninguna consulta coincide con la búsqueda.");
  });
});

describe("AdminInquiryDetail", () => {
  const detail = (overrides: Partial<AdminInquiryDetailData> = {}): AdminInquiryDetailData => ({ ...summary(), messages: [], ...overrides });

  it("shows the contact data of the spec, links the property and offers the reply box", () => {
    const html = renderToStaticMarkup(<AdminInquiryDetail inquiry={detail()} />);
    for (const value of ["Ana García", "ana@test.com", "+56 9 1234 5678", "Ana García (ana@test.com)", "1 de octubre de 2026"]) {
      expect(html).toContain(value);
    }
    expect(html).toContain('href="/properties/22222222-2222-4222-8222-222222222222"');
    expect(html).toMatch(/<label for="inquiry-reply"[^>]*>Tu respuesta<\/label>/);
    expect(html).not.toContain("mailto:ana@test.com?subject");
  });

  it("offers answering a visitor by email, and does not link a property that is no longer public", () => {
    const html = renderToStaticMarkup(<AdminInquiryDetail inquiry={detail({ user: null, isPropertyPublic: false })} />);
    expect(html).toContain("Visitante sin cuenta");
    expect(html).toContain("mailto:ana@test.com?subject=");
    expect(html).toContain("(ya no está publicada)");
    expect(html).not.toContain('href="/properties/');
  });
});

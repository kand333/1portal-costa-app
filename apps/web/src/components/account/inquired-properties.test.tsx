import type { UserInquiry } from "@portal/shared/inquiry";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMyInquiries } from "@/hooks/use-my-inquiries";
import { InquiredProperties } from "./inquired-properties";

vi.mock("@/hooks/use-my-inquiries", () => ({ useMyInquiries: vi.fn() }));

const inquiry: UserInquiry = {
  id: "i1",
  propertyId: "5eed0000-0000-4000-8000-000000000001",
  propertyTitle: "Casa con piscina",
  message: "Quisiera coordinar una visita esta semana.",
  createdAt: "2026-10-02T15:00:00.000Z",
  adminReplyCount: 0,
  lastActivityAt: "2026-10-02T15:00:00.000Z",
  lastMessage: null,
  property: {
    id: "5eed0000-0000-4000-8000-000000000001",
    title: "Casa con piscina",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: 890000,
    currency: "USD",
    usableArea: 320,
    totalArea: 650,
    bedrooms: 5,
    bathrooms: 4,
    commune: "Lo Barnechea",
    city: "Santiago",
    region: "Región Metropolitana",
    isFeatured: true,
    mainImageUrl: null,
    createdAt: "2026-09-16T12:00:00.000Z",
  },
};

const mockInquiries = (value: Partial<ReturnType<typeof useMyInquiries>>) =>
  vi.mocked(useMyInquiries).mockReturnValue({
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
    ...value,
  } as ReturnType<typeof useMyInquiries>);

beforeEach(() => vi.mocked(useMyInquiries).mockReset());

describe("InquiredProperties", () => {
  it("shows placeholders while loading", () => {
    mockInquiries({ isLoading: true });
    expect(renderToStaticMarkup(<InquiredProperties />)).toContain('aria-label="Cargando tus consultas"');
  });

  it("shows the empty state when the user has not asked about any property", () => {
    mockInquiries({ data: [] });
    expect(renderToStaticMarkup(<InquiredProperties />)).toContain("Aún no has consultado por ninguna propiedad.");
  });

  it("lists each inquiry with a link to the property, its date, price, location and message", () => {
    mockInquiries({ data: [inquiry] });
    const html = renderToStaticMarkup(<InquiredProperties />);
    expect(html).toContain(`href="/properties/${inquiry.property?.id}"`);
    expect(html).toContain('dateTime="2026-10-02T15:00:00.000Z"');
    expect(html).toContain("2 de octubre de 2026");
    expect(html).toContain("US$890.000");
    expect(html).toContain("Lo Barnechea, Santiago");
    expect(html).toContain("Quisiera coordinar una visita esta semana.");
  });

  it("shows a table with photo linked to the property, title, message and a delete button", () => {
    mockInquiries({ data: [{ ...inquiry, property: { ...inquiry.property!, mainImageUrl: "https://images.test/casa.jpg" } }] });
    const html = renderToStaticMarkup(<InquiredProperties />);
    for (const header of ["Foto", "Propiedad", "Mensaje enviado"]) expect(html).toContain(`>${header}</th>`);
    expect(html).toMatch(/<a [^>]*tabindex="-1"[^>]*href="\/properties\/5eed0000-0000-4000-8000-000000000001"[^>]*><img/);
    expect(html).toContain('aria-label="Eliminar la consulta sobre «Casa con piscina»"');
    expect(html).toMatch(/for="my-inquiries-search"[^>]*>Buscar por título de la propiedad o texto del mensaje<\/label>/);
    expect(html).toContain("1 consulta");
  });

  it("shows 6 inquiries per page with page navigation", () => {
    mockInquiries({ data: Array.from({ length: 7 }, (_, index) => ({ ...inquiry, id: `i${index}` })) });
    const html = renderToStaticMarkup(<InquiredProperties />);
    expect(html.match(/Eliminar la consulta/g)).toHaveLength(6);
    expect(html).toContain("Página 1 de 2");
    expect(html).toContain("7 consultas");
  });

  it("has no page navigation with 6 inquiries or fewer", () => {
    mockInquiries({ data: [inquiry] });
    expect(renderToStaticMarkup(<InquiredProperties />)).not.toContain("Paginación de tus consultas");
  });

  it("keeps the inquiry, without a link, when the property is no longer published", () => {
    mockInquiries({ data: [{ ...inquiry, property: null }] });
    const html = renderToStaticMarkup(<InquiredProperties />);
    expect(html).toContain("Casa con piscina");
    expect(html).toContain("Esta propiedad ya no está publicada.");
    expect(html).not.toContain('href="/properties/');
  });

  it("offers a retry when the list cannot be loaded", () => {
    mockInquiries({ error: new Error("Error interno") });
    const html = renderToStaticMarkup(<InquiredProperties />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Reintentar");
  });

  it("links each inquiry to its conversation and counts the portal's replies", () => {
    mockInquiries({ data: [{ ...inquiry, adminReplyCount: 2 }] });
    const html = renderToStaticMarkup(<InquiredProperties />);
    expect(html).toContain(`href="/account/inquiries/${inquiry.id}"`);
    expect(html).toContain("2 respuestas del portal");
  });

  it("shows the last entry of the conversation, saying who wrote it", () => {
    mockInquiries({
      data: [
        { ...inquiry, lastMessage: { fromAdmin: true, body: "Sí, la visita puede ser el sábado.", createdAt: "2026-10-04T21:07:00.000Z" } },
        { ...inquiry, id: "i2", lastMessage: { fromAdmin: false, body: "¿A qué hora?", createdAt: "2026-10-04T22:00:00.000Z" } },
      ],
    });
    const html = renderToStaticMarkup(<InquiredProperties />);
    expect(html).toMatch(/Última entrada · <span[^>]*>Portal<\/span>[^]*?Sí, la visita puede ser el sábado\./);
    expect(html).toMatch(/Última entrada · <span[^>]*>Tú<\/span>[^]*?¿A qué hora\?/);
  });

  it("shows no last entry while nobody has answered", () => {
    mockInquiries({ data: [inquiry] });
    expect(renderToStaticMarkup(<InquiredProperties />)).not.toContain("Última entrada");
  });
});

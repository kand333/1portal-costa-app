import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { InquiryReplyForm } from "./inquiry-reply-form";
import { InquiryThread } from "./inquiry-thread";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const inquiry = { name: "Ana", message: "¿Sigue disponible?", createdAt: "2026-10-01T12:00:00.000Z" };
const messages = [
  { id: "m1", fromAdmin: true, authorName: "Admin Portal", body: "Sí, sigue disponible.", createdAt: "2026-10-01T13:00:00.000Z" },
  { id: "m2", fromAdmin: false, authorName: "Ana", body: "¿Puedo visitarla?", createdAt: "2026-10-01T14:00:00.000Z" },
];

const bodies = (html: string) => [...html.matchAll(/<p class="mt-1[^"]*">([^<]+)<\/p>/g)].map((match) => match[1]);

describe("InquiryThread", () => {
  it("starts with the inquiry and keeps the order of the conversation", () => {
    const html = renderToStaticMarkup(<InquiryThread viewer="admin" inquiry={inquiry} messages={messages} />);
    expect(bodies(html)).toEqual(["¿Sigue disponible?", "Sí, sigue disponible.", "¿Puedo visitarla?"]);
    expect(html).toContain('aria-label="Conversación"');
  });

  it("puts the viewer's own messages on the right", () => {
    const forAdmin = renderToStaticMarkup(<InquiryThread viewer="admin" inquiry={inquiry} messages={messages} />);
    expect(forAdmin.match(/justify-end/g)).toHaveLength(1);
    const forUser = renderToStaticMarkup(<InquiryThread viewer="user" inquiry={inquiry} messages={messages} />);
    expect(forUser.match(/justify-end/g)).toHaveLength(2);
  });

  it("shows the administrator's name to ADMIN and «Portal Inmobiliario» to the user", () => {
    expect(renderToStaticMarkup(<InquiryThread viewer="admin" inquiry={inquiry} messages={messages} />)).toContain(">Admin Portal<");
    const forUser = renderToStaticMarkup(<InquiryThread viewer="user" inquiry={inquiry} messages={messages} />);
    expect(forUser).toContain(">Portal Inmobiliario<");
    expect(forUser).not.toContain("Admin Portal");
  });
});

describe("InquiryReplyForm", () => {
  it("has a labelled message box and a send button", () => {
    const html = renderToStaticMarkup(<InquiryReplyForm endpoint="/api/x" label="Tu respuesta" />);
    expect(html).toMatch(/<label for="inquiry-reply"[^>]*>Tu respuesta<\/label>/);
    expect(html).toContain('maxLength="2000"');
    expect(html).toContain(">Enviar respuesta</button>");
  });
});

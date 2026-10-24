import { afterEach, describe, expect, it, vi } from "vitest";
import { submitLead } from "./lead-submission";

const data = {
  kind: "VALUATION",
  source: "home-hero",
  name: "María Pérez",
  email: "maria@correo.cl",
  phone: undefined,
  address: "Barros Arana 1000",
  commune: "Concepción",
  operation: undefined,
  propertyType: undefined,
  message: undefined,
  website: undefined,
} as const;
const created = { id: "lead-1", kind: "VALUATION", createdAt: "2026-10-02T12:00:00.000Z" };

function stubFetch(...responses: (Response | Error)[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
    else fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const requestBody = (fetchMock: ReturnType<typeof vi.fn>, call: number) =>
  JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string);

afterEach(() => vi.unstubAllGlobals());

describe("submitLead", () => {
  it("stores the lead through the API first, then emails it with Web3Forms", async () => {
    const fetchMock = stubFetch(Response.json(created, { status: 201 }), Response.json({ success: true }));

    await expect(submitLead(data, "web3forms-key")).resolves.toEqual({ status: "sent", lead: created, emailSent: true });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/leads");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.web3forms.com/submit");
    expect(requestBody(fetchMock, 1)).toMatchObject({
      access_key: "web3forms-key",
      subject: "Solicitud de tasación",
      replyto: "maria@correo.cl",
      address: "Barros Arana 1000",
      commune: "Concepción",
      source: "home-hero",
      lead_id: "lead-1",
    });
  });

  it("still reports the lead as sent when the email fails, because it is stored", async () => {
    stubFetch(Response.json(created, { status: 201 }), Response.json({ success: false }, { status: 403 }));
    await expect(submitLead(data, "web3forms-key")).resolves.toMatchObject({ status: "sent", emailSent: false });
  });

  it("skips the email when no Web3Forms key is configured", async () => {
    const fetchMock = stubFetch(Response.json(created, { status: 201 }));
    await expect(submitLead(data, undefined)).resolves.toMatchObject({ status: "sent", emailSent: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the API error message and sends no email when the lead is rejected", async () => {
    const fetchMock = stubFetch(Response.json({ message: "Ingresa un email válido", status: 400 }, { status: 400 }));
    await expect(submitLead(data, "web3forms-key")).resolves.toEqual({ status: "error", message: "Ingresa un email válido" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("explains a network failure", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    await expect(submitLead(data, "web3forms-key")).resolves.toEqual({
      status: "error",
      message: "No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.",
    });
  });
});

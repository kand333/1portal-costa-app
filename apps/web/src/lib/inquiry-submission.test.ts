import { afterEach, describe, expect, it, vi } from "vitest";
import { submitInquiry } from "./inquiry-submission";

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }));
vi.mock("swr", () => ({ mutate: mutateMock }));

const data = {
  propertyId: "5eed0000-0000-4000-8000-000000000001",
  name: "María Pérez",
  email: "maria@correo.cl",
  phone: undefined,
  message: "Me interesa visitar la propiedad.",
};
const created = {
  id: "inquiry-1",
  propertyId: data.propertyId,
  propertyTitle: "Casa con piscina",
  createdAt: "2026-10-02T12:00:00.000Z",
};

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

describe("submitInquiry", () => {
  it("stores the inquiry through the API first, then emails it with Web3Forms", async () => {
    const fetchMock = stubFetch(Response.json(created, { status: 201 }), Response.json({ success: true }));

    await expect(submitInquiry(data, "web3forms-key")).resolves.toEqual({
      status: "sent",
      inquiry: created,
      emailSent: true,
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/inquiries");
    // A logged-in user sees the new inquiry in /account.
    expect(mutateMock).toHaveBeenCalledWith("/api/account/inquiries");
    expect(requestBody(fetchMock, 0)).toEqual({ ...data, phone: undefined });
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.web3forms.com/submit");
    expect(requestBody(fetchMock, 1)).toMatchObject({
      access_key: "web3forms-key",
      subject: "Consulta por «Casa con piscina»",
      replyto: "maria@correo.cl",
      name: "María Pérez",
      email: "maria@correo.cl",
      message: "Me interesa visitar la propiedad.",
      property_id: data.propertyId,
      property_title: "Casa con piscina",
      inquiry_id: "inquiry-1",
    });
  });

  it("still reports the inquiry as sent when the email fails, because it is stored", async () => {
    stubFetch(Response.json(created, { status: 201 }), Response.json({ success: false }, { status: 403 }));
    await expect(submitInquiry(data, "web3forms-key")).resolves.toMatchObject({ status: "sent", emailSent: false });

    stubFetch(Response.json(created, { status: 201 }), new TypeError("Failed to fetch"));
    await expect(submitInquiry(data, "web3forms-key")).resolves.toMatchObject({ status: "sent", emailSent: false });
  });

  it("skips the email when no Web3Forms key is configured", async () => {
    const fetchMock = stubFetch(Response.json(created, { status: 201 }));
    await expect(submitInquiry(data, undefined)).resolves.toMatchObject({ status: "sent", emailSent: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the API error message and sends no email when the inquiry is rejected", async () => {
    const fetchMock = stubFetch(Response.json({ message: "Propiedad no encontrada", status: 404 }, { status: 404 }));
    await expect(submitInquiry(data, "web3forms-key")).resolves.toEqual({
      status: "error",
      message: "Propiedad no encontrada",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("explains a network failure", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    await expect(submitInquiry(data, "web3forms-key")).resolves.toEqual({
      status: "error",
      message: "No pudimos enviar tu consulta. Revisa tu conexión e inténtalo de nuevo.",
    });
  });
});

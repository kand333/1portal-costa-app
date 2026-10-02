import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, fetchJson, postJson } from "./api-client";

afterEach(() => vi.unstubAllGlobals());

describe("fetchJson", () => {
  it("returns the parsed body of successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [1] })));
    await expect(fetchJson("/api/properties")).resolves.toEqual({ data: [1] });
  });

  it("throws ApiClientError with the REST message on errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Propiedad no encontrada", status: 404 }, { status: 404 })),
    );
    await expect(fetchJson("/api/properties/x")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 404,
      message: "Propiedad no encontrada",
    });
  });

  it("uses a generic message when the error body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));
    const error = await fetchJson("/api/properties").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ status: 502, message: "No fue posible cargar la información" });
  });
});

describe("postJson", () => {
  it("sends the body as JSON and returns the parsed response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "1" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(postJson("/api/inquiries", { name: "Ana" })).resolves.toEqual({ id: "1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/inquiries",
      expect.objectContaining({ method: "POST", body: '{"name":"Ana"}' }),
    );
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("throws ApiClientError with the REST message on errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Ingresa tu nombre", status: 400 }, { status: 400 })),
    );
    await expect(postJson("/api/inquiries", {})).rejects.toMatchObject({ status: 400, message: "Ingresa tu nombre" });
  });
});

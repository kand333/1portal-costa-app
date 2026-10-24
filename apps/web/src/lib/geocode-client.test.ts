import { afterEach, describe, expect, it, vi } from "vitest";
import { locateInBrowser } from "./geocode-client";

const respond = (results: { lat: string; lon: string }[]) =>
  vi.fn().mockResolvedValue({ ok: true, json: async () => results });

afterEach(() => vi.unstubAllGlobals());

describe("locateInBrowser", () => {
  it("returns the street point with a close zoom", async () => {
    vi.stubGlobal("fetch", respond([{ lat: "-36.82", lon: "-73.04" }]));
    const found = await locateInBrowser({ address: "Barros Arana 1000", commune: "Concepción" }, new AbortController().signal);
    expect(found).toEqual({ latitude: -36.82, longitude: -73.04, zoom: 16 });
  });

  it("falls back to the commune when the street is not found", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ lat: "-36.8", lon: "-73.0" }] });
    vi.stubGlobal("fetch", fetchMock);
    const found = await locateInBrowser({ address: "Calle inventada 1", commune: "Penco" }, new AbortController().signal);
    expect(found).toEqual({ latitude: -36.8, longitude: -73, zoom: 13 });
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("Penco");
  });

  it("returns null instead of throwing when the lookup fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await locateInBrowser({ address: "", commune: "Lota" }, new AbortController().signal)).toBeNull();
  });
});

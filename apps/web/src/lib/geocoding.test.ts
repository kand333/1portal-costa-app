import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeAddress } from "./geocoding";

const parts = {
  address: "Av. Apoquindo 4500",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function stubFetch(...responses: (Response | Error)[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
    else fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const requestedSearchParams = (fetchMock: ReturnType<typeof vi.fn>, call: number) =>
  new URL(fetchMock.mock.calls[call][0] as string).searchParams;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("geocodeAddress", () => {
  it("locates the full address with a close zoom", async () => {
    const fetchMock = stubFetch(jsonResponse([{ lat: "-33.4107", lon: "-70.5701" }]));

    await expect(geocodeAddress(parts)).resolves.toEqual({ latitude: -33.4107, longitude: -70.5701, zoom: 16 });
    const searchParams = requestedSearchParams(fetchMock, 0);
    expect(searchParams.get("q")).toBe("Av. Apoquindo 4500, Las Condes, Santiago, Región Metropolitana, Chile");
    expect(searchParams.get("countrycodes")).toBe("cl");
    expect(searchParams.get("limit")).toBe("1");
  });

  it("identifies itself and caches the result, as the Nominatim usage policy requires", async () => {
    const fetchMock = stubFetch(jsonResponse([{ lat: "-33.4", lon: "-70.5" }]));
    await geocodeAddress(parts);
    const options = fetchMock.mock.calls[0][1] as RequestInit & { next?: { revalidate?: number } };
    expect((options.headers as Record<string, string>)["User-Agent"]).toMatch(/^PortalInmobiliario\//);
    expect(options.next?.revalidate).toBeGreaterThan(0);
  });

  it("falls back to the commune with a wider zoom when the street is not found", async () => {
    const fetchMock = stubFetch(jsonResponse([]), jsonResponse([{ lat: "-33.41", lon: "-70.56" }]));

    await expect(geocodeAddress(parts)).resolves.toEqual({ latitude: -33.41, longitude: -70.56, zoom: 13 });
    expect(requestedSearchParams(fetchMock, 1).get("q")).toBe("Las Condes, Santiago, Región Metropolitana, Chile");
  });

  it("returns null when nothing is found", async () => {
    stubFetch(jsonResponse([]), jsonResponse([]));
    await expect(geocodeAddress(parts)).resolves.toBeNull();
  });

  it("returns null when the service fails or times out, so the page still renders", async () => {
    stubFetch(jsonResponse({ error: "down" }, 503), jsonResponse({ error: "down" }, 503));
    await expect(geocodeAddress(parts)).resolves.toBeNull();

    stubFetch(new Error("timeout"));
    await expect(geocodeAddress(parts)).resolves.toBeNull();
  });

  it("ignores a result without valid coordinates", async () => {
    stubFetch(jsonResponse([{ lat: "abc", lon: "-70.5" }]), jsonResponse([]));
    await expect(geocodeAddress(parts)).resolves.toBeNull();
  });
});

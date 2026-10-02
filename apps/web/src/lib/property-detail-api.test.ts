import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPropertyDetail } from "./property-detail-api";

const validId = "5eed0000-0000-4000-8000-000000000001";

function mockFetch(status: number, body: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchPropertyDetail", () => {
  it("requests the property from the backend without caching", async () => {
    vi.stubEnv("API_INTERNAL_URL", "http://api.test");
    const fetchMock = mockFetch(200, { id: validId, title: "Casa" });

    await expect(fetchPropertyDetail(validId)).resolves.toEqual({ id: validId, title: "Casa" });
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/api/properties/${validId}`,
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("returns null for a property that does not exist or is not published", async () => {
    mockFetch(404, { message: "Propiedad no encontrada", status: 404 });
    await expect(fetchPropertyDetail(validId)).resolves.toBeNull();
  });

  it("returns null for an invalid id without calling the API", async () => {
    const fetchMock = mockFetch(200);
    await expect(fetchPropertyDetail("not-a-uuid")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the API fails, so the page can offer a retry", async () => {
    mockFetch(500, { message: "Error interno", status: 500 });
    await expect(fetchPropertyDetail(validId)).rejects.toThrow("HTTP 500");
  });
});

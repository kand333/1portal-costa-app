import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import { buildSitemapEntries } from "./sitemap-entries";

const jsonResponse = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe("sitemap and robots", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://propizoom.example/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("lists the public pages and every published property, paging through the API", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse({ data: [{ id: "a", createdAt: "2026-10-01T00:00:00.000Z" }], meta: { page: 1, pageSize: 50, total: 2, totalPages: 2 } }),
      )
      .mockImplementationOnce(() =>
        jsonResponse({ data: [{ id: "b", createdAt: "2026-10-02T00:00:00.000Z" }], meta: { page: 2, pageSize: 50, total: 2, totalPages: 2 } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const urls = (await buildSitemapEntries()).map((entry) => entry.url);

    expect(urls).toEqual([
      "https://propizoom.example",
      "https://propizoom.example/properties",
      "https://propizoom.example/tasador-propiedades",
      "https://propizoom.example/tasacion/casa/concepcion",
      "https://propizoom.example/tasacion/departamento/concepcion",
      "https://propizoom.example/properties/a",
      "https://propizoom.example/properties/b",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps only the fixed pages when the API cannot answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));

    const urls = (await buildSitemapEntries()).map((entry) => entry.url);

    expect(urls).toHaveLength(5);
  });

  it("blocks private areas in robots.txt and points to the sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://propizoom.example/sitemap.xml");
    expect(result.rules).toMatchObject({ allow: "/", disallow: ["/admin", "/account", "/api"] });
  });
});

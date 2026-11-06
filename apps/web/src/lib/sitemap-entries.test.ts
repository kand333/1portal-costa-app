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
    // Per-landing counts (pageSize=1 with a city filter): only Concepción and Talcahuano have properties.
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("city=")) {
        const total = /city=(concepcion|talcahuano)/.test(url) ? 3 : 0;
        return jsonResponse({ data: [], meta: { page: 1, pageSize: 1, total, totalPages: total } });
      }
      return url.includes("page=2")
        ? jsonResponse({ data: [{ id: "b", createdAt: "2026-10-02T00:00:00.000Z" }], meta: { page: 2, pageSize: 50, total: 2, totalPages: 2 } })
        : jsonResponse({ data: [{ id: "a", createdAt: "2026-10-01T00:00:00.000Z" }], meta: { page: 1, pageSize: 50, total: 2, totalPages: 2 } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const urls = (await buildSitemapEntries()).map((entry) => entry.url);

    expect(urls).toEqual([
      "https://propizoom.example",
      "https://propizoom.example/properties",
      "https://propizoom.example/tasador-propiedades",
      "https://propizoom.example/regularizacion",
      "https://propizoom.example/privacidad",
      "https://propizoom.example/tasacion/casa/concepcion",
      "https://propizoom.example/tasacion/casa/talcahuano",
      "https://propizoom.example/tasacion/departamento/concepcion",
      "https://propizoom.example/tasacion/departamento/talcahuano",
      "https://propizoom.example/guias",
      "https://propizoom.example/guias/cuanto-cuesta-una-tasacion",
      "https://propizoom.example/guias/como-saber-cuanto-vale-tu-propiedad",
      "https://propizoom.example/guias/que-revisar-al-comprar-un-proyecto-nuevo",
      "https://propizoom.example/guias/vender-o-arrendar-como-decidir",
      "https://propizoom.example/properties/a",
      "https://propizoom.example/properties/b",
    ]);
    expect(urls.some((url) => /hualpen|chiguayante|san-pedro/.test(url))).toBe(false);
    expect(urls.some((url) => /casa-sin-escritura|recepcion-final|ampliacion|herencia/.test(url))).toBe(false);
  });

  it("keeps only the fixed pages when the API cannot answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));

    const urls = (await buildSitemapEntries()).map((entry) => entry.url);

    // Fixed pages, the guides and every landing (an unknown count keeps a landing).
    expect(urls).toHaveLength(5 + 10 + 5);
  });

  it("blocks private areas in robots.txt and points to the sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://propizoom.example/sitemap.xml");
    expect(result.rules).toMatchObject({ allow: "/", disallow: ["/admin", "/account", "/api"] });
  });
});

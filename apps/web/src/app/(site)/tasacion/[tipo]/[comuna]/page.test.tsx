import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchPropertiesFallback = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock("@/lib/properties-server", () => ({ fetchPropertiesFallback }));
// Number of published properties per landing; null (API down) keeps a landing indexable.
const countLandingProperties = vi.hoisted(() =>
  vi.fn<(landing: { communeSlug: string }) => Promise<number | null>>(async () => null),
);
vi.mock("@/lib/landing-availability", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/landing-availability")>()),
  countLandingProperties,
}));

import ValuationLandingPage, { generateMetadata, generateStaticParams } from "./page";

const params = (tipo: string, comuna: string) => ({ params: Promise.resolve({ tipo, comuna }) }) as never;

describe("ValuationLandingPage", () => {
  it("prerenders only the listed type and commune pairs", () => {
    const pairs = generateStaticParams();
    expect(pairs).toHaveLength(10);
    expect(pairs).toContainEqual({ tipo: "casa", comuna: "concepcion" });
    expect(pairs).toContainEqual({ tipo: "departamento", comuna: "talcahuano" });
    expect(pairs).not.toContainEqual({ tipo: "casa", comuna: "lota" });
  });

  it("shows the keyword in the heading, links to the estimator and adds breadcrumbs", async () => {
    const html = renderToStaticMarkup(await ValuationLandingPage(params("casa", "concepcion")));
    expect(html).toContain("Tasación de casas en Concepción");
    expect(html).toContain('href="/tasador-propiedades"');
    expect(html).toContain("Tasar mi casa gratis");
    expect(html).toContain("BreadcrumbList");
    expect(html).toContain("Casas publicadas en Concepción");
    // The list is loaded on the server with the same query the client list uses.
    expect(fetchPropertiesFallback).toHaveBeenCalledWith([{ city: ["concepcion"], type: "HOUSE", pageSize: 3 }]);
    expect(html).toContain('href="/tasacion/departamento/concepcion"');
  });

  it("agrees articles and participles with the gender of each type", async () => {
    const house = renderToStaticMarkup(await ValuationLandingPage(params("casa", "concepcion")));
    expect(house).toContain("Qué influye en el valor de una casa en Concepción");
    expect(house).toContain("Casas publicadas en Concepción");
    expect(house).toContain("Ver todas las casas");

    const apartment = renderToStaticMarkup(await ValuationLandingPage(params("departamento", "concepcion")));
    expect(apartment).toContain("Qué influye en el valor de un departamento en Concepción");
    expect(apartment).toContain("Departamentos publicados en Concepción");
    expect(apartment).toContain("Ver todos los departamentos");
    expect(apartment).not.toContain("una departamento");
  });

  it("does not state market figures it cannot back", async () => {
    const html = renderToStaticMarkup(await ValuationLandingPage(params("departamento", "concepcion")));
    expect(html).not.toMatch(/UF\s?\d/);
    expect(html).not.toMatch(/\$\s?\d/);
  });

  it("answers 404 for pages that do not exist", async () => {
    await expect(ValuationLandingPage(params("casa", "lota"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("keeps a landing out of Google while the portal has no properties for it", async () => {
    countLandingProperties.mockResolvedValueOnce(0);
    expect((await generateMetadata(params("casa", "hualpen"))).robots).toEqual({ index: false, follow: true });
    countLandingProperties.mockResolvedValueOnce(4);
    expect((await generateMetadata(params("casa", "talcahuano"))).robots).toBeUndefined();
    countLandingProperties.mockResolvedValueOnce(null);
    expect((await generateMetadata(params("casa", "talcahuano"))).robots).toBeUndefined();
  });

  it("links only to sibling landings that have properties", async () => {
    countLandingProperties.mockImplementation(async (landing) => (landing.communeSlug === "hualpen" ? 0 : 2));
    const html = renderToStaticMarkup(await ValuationLandingPage(params("casa", "concepcion")));
    expect(html).toContain("/tasacion/casa/talcahuano");
    expect(html).not.toContain("/tasacion/casa/hualpen");
    countLandingProperties.mockImplementation(async () => null);
  });

  it("sets title, canonical and Open Graph", async () => {
    const metadata = await generateMetadata(params("casa", "concepcion"));
    expect(metadata.title).toBe("Tasación de casas en Concepción gratis | PropiZoom");
    expect(metadata.alternates?.canonical).toBe("/tasacion/casa/concepcion");
    expect(metadata.openGraph).toMatchObject({
      url: "/tasacion/casa/concepcion",
      locale: "es_CL",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    });
  });
});

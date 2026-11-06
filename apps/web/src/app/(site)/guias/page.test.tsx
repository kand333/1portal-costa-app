import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import GuidePage, { generateMetadata, generateStaticParams } from "./[slug]/page";
import GuidesPage, { metadata } from "./page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) }) as never;

describe("guides hub", () => {
  it("lists the published guides under their section and links each one", () => {
    const html = renderToStaticMarkup(<GuidesPage />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Tasación, compra y venta");
    expect(html).toContain('href="/guias/cuanto-cuesta-una-tasacion"');
    expect(metadata.alternates?.canonical).toBe("/guias");
  });
});

describe("guide page", () => {
  it("prerenders one page per guide and answers 404 for the rest", async () => {
    expect(generateStaticParams().map((entry) => entry.slug)).toContain("cuanto-cuesta-una-tasacion");
    await expect(GuidePage(params("no-existe"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows the answer first, the sources, structured data and a link to the estimator", async () => {
    const html = renderToStaticMarkup(await GuidePage(params("cuanto-cuesta-una-tasacion")));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Fuentes");
    expect(html).toContain("&quot;@type&quot;:&quot;Article&quot;".replace(/&quot;/g, '"'));
    expect(html).toContain("BreadcrumbList");
    expect(html).toContain('href="/tasador-propiedades"');
    expect(html.indexOf("La estimación online")).toBeGreaterThan(-1);
  });

  it("sets title, canonical and Open Graph article metadata", async () => {
    const metadata = await generateMetadata(params("cuanto-cuesta-una-tasacion"));
    expect(metadata.title).toBe("¿Cuánto cuesta una tasación en Concepción? | PropiZoom");
    expect(metadata.alternates?.canonical).toBe("/guias/cuanto-cuesta-una-tasacion");
    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph).toMatchObject({ type: "article", locale: "es_CL" });
  });
});

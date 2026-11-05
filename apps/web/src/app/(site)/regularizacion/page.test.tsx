import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProblemExplorer } from "@/components/regularizacion/problem-explorer";
import { PROPERTY_PROBLEMS } from "@/lib/regularization";
import RegularizationPage, { metadata } from "./page";

describe("regularization page", () => {
  const html = renderToStaticMarkup(<RegularizationPage />);

  it("has one H1, a canonical URL and links to the default flows", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(metadata.alternates?.canonical).toBe("/regularizacion");
    expect(html).toContain('href="/tasador-propiedades"');
    expect(html).toContain('href="/properties?operation=SALE"');
    expect(html).toContain('href="/#tasacion-gratis"');
  });

  it("does not promise own legal services, prices or deadlines", () => {
    const text = html.replace(/<[^>]+>/g, "").toLowerCase();
    expect(text).not.toMatch(/abogados? propios?|asesor[ií]a legal gratuita|garantiz/);
  });
});

describe("ProblemExplorer", () => {
  const html = renderToStaticMarkup(<ProblemExplorer />);

  it("renders a tab per problem and the first panel selected", () => {
    expect(html.match(/role="tab"/g)).toHaveLength(PROPERTY_PROBLEMS.length);
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain(PROPERTY_PROBLEMS[0].steps[0]);
  });
});

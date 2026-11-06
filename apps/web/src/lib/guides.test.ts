import { describe, expect, it } from "vitest";
import { getGuide, GUIDES, guidePath, listGuides } from "./guides";

describe("guides", () => {
  it("has unique slugs and a summary short enough to be a meta description", () => {
    const slugs = GUIDES.map((guide) => guide.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const guide of GUIDES) {
      expect(guide.summary.length).toBeLessThanOrEqual(155);
      expect(guide.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("cites at least one source over https and has a review date for every guide", () => {
    for (const guide of GUIDES) {
      expect(guide.sources.length).toBeGreaterThan(0);
      for (const source of guide.sources) expect(source.url).toMatch(/^https:\/\//);
      expect(guide.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("keeps the legal guides as drafts until they are reviewed, and out of the published list", () => {
    const published = listGuides();
    expect(published.every((guide) => guide.status === "published")).toBe(true);
    expect(published.some((guide) => guide.section === "regularizacion")).toBe(false);
    expect(getGuide("herencia-y-posesion-efectiva")).toBeNull();
    expect(getGuide("herencia-y-posesion-efectiva", { includeDrafts: true })?.section).toBe("regularizacion");
  });

  it("does not state costs, deadlines or market figures it cannot back", () => {
    for (const guide of GUIDES) {
      const text = JSON.stringify([guide.answer, guide.blocks]);
      expect(text).not.toMatch(/\$\s?\d/);
      expect(text).not.toMatch(/\d+\s?(UF|días|semanas|meses)/i);
    }
  });

  it("builds the path of a guide", () => {
    expect(guidePath("cuanto-cuesta-una-tasacion")).toBe("/guias/cuanto-cuesta-una-tasacion");
  });
});

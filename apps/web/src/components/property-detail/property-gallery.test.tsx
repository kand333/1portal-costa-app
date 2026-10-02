import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyGallery } from "./property-gallery";

const images = [
  { id: "image-3", url: "https://images.unsplash.com/photo-3", position: 2, isMain: false },
  { id: "image-2", url: "https://images.unsplash.com/photo-2", position: 1, isMain: true },
  { id: "image-1", url: "https://images.unsplash.com/photo-1", position: 0, isMain: false },
];

const render = (list = images) =>
  renderToStaticMarkup(<PropertyGallery images={list} imageDescription="Casa en Providencia: Casa luminosa" />);

describe("PropertyGallery", () => {
  it("starts with the main photo, described with its place in the gallery", () => {
    const html = render();
    expect(html).toMatch(/<img alt="Casa en Providencia: Casa luminosa\. Foto 1 de 3"[^>]*photo-2/);
  });

  it("offers previous/next buttons and a counter", () => {
    const html = render();
    expect(html).toContain('aria-label="Foto anterior"');
    expect(html).toContain('aria-label="Foto siguiente"');
    expect(html).toMatch(/aria-live="polite"[^>]*>1 \/ 3<\/p>/);
  });

  it("shows one thumbnail button per photo, in gallery order, marking the active one", () => {
    const html = render();
    const labels = [...html.matchAll(/aria-label="Ver foto (\d) de 3"/g)].map((match) => match[1]);
    expect(labels).toEqual(["1", "2", "3"]);
    expect(html).toMatch(/aria-label="Ver foto 1 de 3" aria-current="true"/);
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
  });

  it("hides the navigation when there is a single photo", () => {
    const html = render([images[0]]);
    expect(html).not.toContain("Foto siguiente");
    expect(html).not.toContain("Ver foto");
    expect(html).toContain("Foto 1 de 1");
  });

  it("shows a placeholder without photos", () => {
    expect(render([])).toContain("Sin fotografía");
  });
});

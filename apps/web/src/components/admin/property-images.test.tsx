import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PropertyImages } from "./property-images";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

type Image = { id: string; url: string; position: number; isMain: boolean };
const image = (id: string, position: number, isMain = false): Image => ({
  id,
  url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
  position,
  isMain,
});

const render = (images: Image[]) =>
  renderToStaticMarkup(<PropertyImages propertyId="p1" propertyTitle="Casa en Ñuñoa" images={images} />);

describe("PropertyImages", () => {
  it("offers uploading several JPG, PNG or WebP images up to 5 MB, 20 per property", () => {
    const html = render([]);
    expect(html).toMatch(/<input[^>]*id="property-image-upload"[^>]*type="file"[^>]*multiple=""[^>]*accept="image\/jpeg,image\/png,image\/webp"/);
    expect(html).toMatch(/<label for="property-image-upload"[^>]*>Subir imágenes/);
    expect(html).toContain("hasta 5 MB, máximo 20");
    expect(html).toContain("Sin imágenes todavía.");
  });

  it("shows the gallery in the public order, the main image first", () => {
    const html = render([image("a", 0), image("b", 1, true), image("c", 2)]);
    expect(html.indexOf("b.jpg")).toBeLessThan(html.indexOf("a.jpg"));
    expect(html.indexOf("a.jpg")).toBeLessThan(html.indexOf("c.jpg"));
    expect(html).toContain(">Principal</span>");
  });

  it("lets every image be deleted, and the others be made main or moved", () => {
    const html = render([image("main", 0, true), image("b", 1), image("c", 2)]);
    expect(html.match(/aria-label="Eliminar la imagen \d"/g)).toHaveLength(3);
    // The main image has no «Principal» button nor arrows.
    expect(html.match(/>Principal<\/button>/g)).toHaveLength(2);
    expect(html).not.toContain('aria-label="Mover la imagen 1 antes"');
    // Nothing moves before the main image, and the last one cannot move further.
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Mover la imagen 2 antes"/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Mover la imagen 3 después"/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*aria-label="Mover la imagen 2 después"/);
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PropertyImages } from "./property-images";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const render = (images: { id: string; url: string; position: number; isMain: boolean }[]) =>
  renderToStaticMarkup(<PropertyImages propertyId="p1" propertyTitle="Casa en Ñuñoa" images={images} />);

describe("PropertyImages", () => {
  it("offers uploading JPG, PNG or WebP up to 5 MB", () => {
    const html = render([]);
    expect(html).toMatch(/<input[^>]*id="property-image-upload"[^>]*type="file"[^>]*accept="image\/jpeg,image\/png,image\/webp"/);
    expect(html).toMatch(/<label for="property-image-upload"[^>]*>Subir imagen/);
    expect(html).toContain("hasta 5 MB");
    expect(html).toContain("Sin imágenes todavía.");
  });

  it("shows the gallery with the main image first", () => {
    const html = render([
      { id: "a", url: "https://res.cloudinary.com/demo/image/upload/a.jpg", position: 0, isMain: false },
      { id: "b", url: "https://res.cloudinary.com/demo/image/upload/b.jpg", position: 1, isMain: true },
    ]);
    const sources = [...html.matchAll(/<img[^>]*alt="Casa en Ñuñoa: imagen (\d)"/g)].map((match) => match[1]);
    expect(sources).toEqual(["1", "2"]);
    expect(html.indexOf("b.jpg")).toBeLessThan(html.indexOf("a.jpg"));
    expect(html).toContain(">Principal</span>");
  });
});

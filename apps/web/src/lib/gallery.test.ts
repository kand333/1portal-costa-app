import { describe, expect, it } from "vitest";
import { orderGalleryImages, stepGalleryIndex } from "./gallery";

const image = (id: string, position: number, isMain = false) => ({ id, url: `https://example.com/${id}`, position, isMain });

describe("orderGalleryImages", () => {
  it("puts the main photo first and the rest by position", () => {
    const ordered = orderGalleryImages([image("c", 2), image("b", 1, true), image("a", 0), image("d", 3)]);
    expect(ordered.map((item) => item.id)).toEqual(["b", "a", "c", "d"]);
  });

  it("orders by position when no photo is marked as main", () => {
    expect(orderGalleryImages([image("b", 1), image("a", 0)]).map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("does not modify the received list", () => {
    const images = [image("b", 1), image("a", 0)];
    orderGalleryImages(images);
    expect(images.map((item) => item.id)).toEqual(["b", "a"]);
  });
});

describe("stepGalleryIndex", () => {
  it("moves forward and backward", () => {
    expect(stepGalleryIndex(0, 1, 3)).toBe(1);
    expect(stepGalleryIndex(2, -1, 3)).toBe(1);
  });

  it("loops at both ends", () => {
    expect(stepGalleryIndex(2, 1, 3)).toBe(0);
    expect(stepGalleryIndex(0, -1, 3)).toBe(2);
  });

  it("stays at zero without photos", () => {
    expect(stepGalleryIndex(0, 1, 0)).toBe(0);
  });
});

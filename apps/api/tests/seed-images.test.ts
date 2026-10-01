import { describe, expect, it } from "vitest";
import { seedProperties } from "../prisma/seed/data";
import { getSeedImages, SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } from "../prisma/seed/images";

const imagesByProperty = seedProperties.map((property) => ({ property, images: getSeedImages(property) }));

describe("getSeedImages", () => {
  it("gives every published property at least one image and drafts none", () => {
    for (const { property, images } of imagesByProperty) {
      if (property.isPublished) expect(images.length, property.title).toBeGreaterThan(0);
      else expect(images, property.title).toEqual([]);
    }
  });

  it("marks exactly the first image as main and numbers positions from zero", () => {
    for (const { property, images } of imagesByProperty.filter(({ images }) => images.length > 0)) {
      expect(images.filter((image) => image.isMain), property.title).toHaveLength(1);
      expect(images[0].isMain, property.title).toBe(true);
      expect(images.map((image) => image.position), property.title).toEqual(images.map((_, index) => index));
    }
  });

  it("uses unique placeholder public ids across all properties", () => {
    const publicIds = imagesByProperty.flatMap(({ images }) => images.map((image) => image.publicId));
    expect(new Set(publicIds).size).toBe(publicIds.length);
    for (const publicId of publicIds) {
      expect(publicId.startsWith(SEED_PLACEHOLDER_PUBLIC_ID_PREFIX)).toBe(true);
    }
  });

  it("does not repeat a photo within the same property and only uses https URLs", () => {
    for (const { property, images } of imagesByProperty) {
      const urls = images.map((image) => image.url);
      expect(new Set(urls).size, property.title).toBe(urls.length);
      for (const url of urls) expect(url.startsWith("https://images.unsplash.com/"), url).toBe(true);
    }
  });

  it("is deterministic", () => {
    const [first] = seedProperties;
    expect(getSeedImages(first)).toEqual(getSeedImages(first));
  });
});

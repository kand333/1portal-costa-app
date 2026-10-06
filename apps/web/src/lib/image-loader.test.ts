import { describe, expect, it } from "vitest";
import imageLoader from "./image-loader";

describe("imageLoader", () => {
  it("asks Cloudinary for an optimized image at the requested width, never upscaled", () => {
    expect(
      imageLoader({ src: "https://res.cloudinary.com/demo/image/upload/v1791097564/propiedades-claude/abc.jpg", width: 640 }),
    ).toBe("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v1791097564/propiedades-claude/abc.jpg");
  });

  it("resizes the Unsplash placeholders, replacing their width and quality", () => {
    const result = new URL(
      imageLoader({ src: "https://images.unsplash.com/photo-1?auto=format&fit=crop&w=1600&q=80", width: 384, quality: 75 }),
    );
    expect(result.searchParams.get("w")).toBe("384");
    expect(result.searchParams.get("q")).toBe("75");
    expect(result.searchParams.get("auto")).toBe("format");
    expect(result.searchParams.get("fit")).toBe("crop");
  });

  it("leaves other sources untouched", () => {
    expect(imageLoader({ src: "/logo.png", width: 256 })).toBe("/logo.png");
    expect(imageLoader({ src: "https://example.com/a.jpg", width: 256 })).toBe("https://example.com/a.jpg");
  });
});

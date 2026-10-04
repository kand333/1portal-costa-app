import { describe, expect, it } from "vitest";
import { detectPropertyImageType, MAX_PROPERTY_IMAGE_BYTES, PROPERTY_IMAGE_MESSAGES } from "./property-image";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => [...text].map((character) => character.charCodeAt(0));

describe("detectPropertyImageType", () => {
  it("recognizes JPEG, PNG and WebP by their first bytes", () => {
    expect(detectPropertyImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe("image/jpeg");
    expect(detectPropertyImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe("image/png");
    expect(detectPropertyImageType(bytes(...ascii("RIFF"), 0x10, 0x00, 0x00, 0x00, ...ascii("WEBPVP8 ")))).toBe("image/webp");
  });

  it("rejects other formats, renamed files and truncated data", () => {
    expect(detectPropertyImageType(bytes(...ascii("%PDF-1.7")))).toBeNull();
    expect(detectPropertyImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(detectPropertyImageType(bytes(...ascii("<svg xmlns")))).toBeNull();
    expect(detectPropertyImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE")))).toBeNull();
    expect(detectPropertyImageType(bytes(0xff, 0xd8))).toBeNull();
    expect(detectPropertyImageType(bytes())).toBeNull();
  });

  it("states the size limit in its message", () => {
    expect(MAX_PROPERTY_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    expect(PROPERTY_IMAGE_MESSAGES.tooLarge).toBe("La imagen supera 5 MB");
  });
});

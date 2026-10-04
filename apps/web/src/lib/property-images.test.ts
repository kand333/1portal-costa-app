import { MAX_PROPERTY_IMAGE_BYTES } from "@portal/shared/property-image";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  arrangePropertyImages,
  deletePropertyImage,
  makeMainImage,
  moveImage,
  uploadPropertyImage,
  validatePropertyImageFile,
} from "./property-images";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

afterEach(() => vi.unstubAllGlobals());

describe("validatePropertyImageFile", () => {
  it("accepts an image within the limit", async () => {
    await expect(validatePropertyImageFile(new Blob([jpeg]))).resolves.toBeNull();
  });

  it("rejects empty, oversized and non-image files (by their bytes)", async () => {
    await expect(validatePropertyImageFile(new Blob([]))).resolves.toBe("La imagen está vacía");
    const large = new Uint8Array(MAX_PROPERTY_IMAGE_BYTES + 1);
    large.set(jpeg);
    await expect(validatePropertyImageFile(new Blob([large]))).resolves.toBe("La imagen supera 5 MB");
    await expect(validatePropertyImageFile(new Blob(["%PDF-1.7"], { type: "image/jpeg" }))).resolves.toBe(
      "Formato no permitido: usa JPG, PNG o WebP",
    );
  });
});

describe("uploadPropertyImage", () => {
  it("POSTs the file as multipart to the property's images", async () => {
    const image = { id: "i1", url: "https://res.cloudinary.com/x.jpg", position: 0, isMain: true };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(image, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadPropertyImage("p1", new File([jpeg], "foto.jpg"))).resolves.toEqual(image);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/properties/p1/images");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("throws the API message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "La imagen supera 5 MB", status: 413 }, { status: 413 })));
    await expect(uploadPropertyImage("p1", new File([jpeg], "foto.jpg"))).rejects.toThrow("La imagen supera 5 MB");
  });
});

describe("image order helpers", () => {
  const order = ["main", "b", "c", "d"];

  it("moves an image one place, keeping the main image first", () => {
    expect(moveImage(order, "c", -1)).toEqual(["main", "c", "b", "d"]);
    expect(moveImage(order, "c", 1)).toEqual(["main", "b", "d", "c"]);
    // Nothing moves before the main image, the main image does not move, and the last stays last.
    expect(moveImage(order, "b", -1)).toBe(order);
    expect(moveImage(order, "main", 1)).toBe(order);
    expect(moveImage(order, "d", 1)).toBe(order);
    expect(moveImage(order, "x", 1)).toBe(order);
  });

  it("puts the new main image first and the former one right after it", () => {
    expect(makeMainImage(order, "c")).toEqual(["c", "main", "b", "d"]);
    expect(makeMainImage(order, "x")).toBe(order);
  });
});

describe("image management requests", () => {
  it("deletes and arranges through the admin API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await deletePropertyImage("p1", "i1");
    await arrangePropertyImages("p1", ["i2", "i3"], "i2");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/properties/p1/images/i1");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/admin/properties/p1/images");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ order: ["i2", "i3"], mainImageId: "i2" });
  });
});

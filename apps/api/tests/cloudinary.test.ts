import { afterEach, describe, expect, it, vi } from "vitest";
import { destroyCloudinaryImage, signCloudinaryParams, uploadPropertyImage } from "@/lib/cloudinary";

describe("signCloudinaryParams", () => {
  it("matches the example of Cloudinary's documentation (sorted params + secret, SHA-1)", () => {
    expect(
      signCloudinaryParams(
        { timestamp: "1315060510", public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" },
        "abcd",
      ),
    ).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("does not depend on the order of the parameters", () => {
    expect(signCloudinaryParams({ folder: "propiedades-claude", timestamp: "1" }, "secret")).toBe(
      signCloudinaryParams({ timestamp: "1", folder: "propiedades-claude" }, "secret"),
    );
  });
});

describe("Cloudinary Upload API calls", () => {
  const stubCloudinary = (response: Response) => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "123456");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uploads to the propiedades-claude folder with a signed request", async () => {
    const fetchMock = stubCloudinary(
      Response.json({ secure_url: "https://res.cloudinary.com/demo-cloud/image/upload/v1/propiedades-claude/a.png", public_id: "propiedades-claude/a" }),
    );
    await expect(uploadPropertyImage(new Blob(["x"], { type: "image/png" }))).resolves.toEqual({
      url: "https://res.cloudinary.com/demo-cloud/image/upload/v1/propiedades-claude/a.png",
      publicId: "propiedades-claude/a",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo-cloud/image/upload");
    const body = init.body as FormData;
    expect(body.get("folder")).toBe("propiedades-claude");
    expect(body.get("api_key")).toBe("123456");
    expect(body.get("signature")).toBe(signCloudinaryParams({ folder: "propiedades-claude", timestamp: String(body.get("timestamp")) }, "secret"));
    expect(body.get("api_secret")).toBeNull();
  });

  it("reports a configuration problem (503) when Cloudinary rejects the key or its permissions", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    stubCloudinary(Response.json({ error: { message: "Request forbidden due to missing permissions" } }, { status: 403 }));
    await expect(uploadPropertyImage(new Blob(["x"]))).rejects.toMatchObject({ status: 503 });
  });

  it("reports other Cloudinary failures as a retryable 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    stubCloudinary(Response.json({ error: { message: "boom" } }, { status: 500 }));
    await expect(destroyCloudinaryImage("propiedades-claude/a")).rejects.toMatchObject({ status: 502 });
  });

  it("is unavailable (503) without credentials", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    await expect(uploadPropertyImage(new Blob(["x"]))).rejects.toMatchObject({ status: 503 });
  });
});

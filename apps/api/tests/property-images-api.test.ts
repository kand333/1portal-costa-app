import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { destroyCloudinaryImage, uploadPropertyImage } from "@/lib/cloudinary";
import { MAX_PROPERTY_IMAGE_BYTES } from "@portal/shared/property-image";

// Integration test against the test database. Cloudinary is replaced by a fake: no real uploads.
vi.mock("@/lib/cloudinary", () => ({ uploadPropertyImage: vi.fn(), destroyCloudinaryImage: vi.fn() }));

loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const pdfBytes = new TextEncoder().encode("%PDF-1.7 not an image");

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-img-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `portal_session=${createSessionToken(user.id)}`;
}

async function upload(propertyId: string, cookie: string | undefined, file?: Blob, name = "foto.jpg") {
  const { POST } = await import("@/app/api/admin/properties/[id]/images/route");
  const form = new FormData();
  if (file) form.set("file", file, name);
  const request = new NextRequest(`http://localhost:3000/api/admin/properties/${propertyId}/images`, {
    method: "POST",
    headers: cookie ? { cookie } : undefined,
    body: form,
  });
  const response = await POST(request, { params: Promise.resolve({ id: propertyId }) });
  return { status: response.status, body: await response.json() };
}

let uploadCount = 0;

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("property images API", () => {
  let admin: string;
  let user: string;
  let propertyId: string;

  beforeAll(async () => {
    admin = await sessionCookieFor("ADMIN");
    user = await sessionCookieFor("USER");
    const prisma = await getPrisma();
    propertyId = (
      await prisma.property.create({
        data: {
          title: `Casa imágenes ${testRunId}`,
          description: "Integration test property",
          operationType: "SALE",
          propertyType: "HOUSE",
          price: "100000",
          address: "Calle 1",
          commune: "Providencia",
          city: "Santiago",
          region: "Región Metropolitana",
          // A seed placeholder: the first real image replaces it.
          images: { create: { url: "https://images.unsplash.com/x", publicId: `seed-placeholder/${testRunId}`, position: 0, isMain: true } },
        },
      })
    ).id;
  });

  beforeEach(() => {
    vi.mocked(uploadPropertyImage).mockReset().mockImplementation(async () => {
      uploadCount += 1;
      const publicId = `propiedades-claude/test-${testRunId}-${uploadCount}`;
      return { url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`, publicId };
    });
    vi.mocked(destroyCloudinaryImage).mockReset().mockResolvedValue(undefined);
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("is for ADMIN only", async () => {
    expect((await upload(propertyId, undefined, new Blob([jpegBytes]))).status).toBe(401);
    expect((await upload(propertyId, user, new Blob([jpegBytes]))).status).toBe(403);
    expect(uploadPropertyImage).not.toHaveBeenCalled();
  });

  it("validates the file before uploading anything", async () => {
    expect(await upload(propertyId, admin)).toEqual({ status: 400, body: { message: "Selecciona una imagen", status: 400 } });
    expect((await upload(propertyId, admin, new Blob([]))).status).toBe(400);
    // A PDF renamed as .jpg is rejected by its bytes.
    expect(await upload(propertyId, admin, new Blob([pdfBytes], { type: "image/jpeg" }), "foto.jpg")).toEqual({
      status: 415,
      body: { message: "Formato no permitido: usa JPG, PNG o WebP", status: 415 },
    });
    const tooLarge = new Uint8Array(MAX_PROPERTY_IMAGE_BYTES + 1);
    tooLarge.set(jpegBytes);
    expect((await upload(propertyId, admin, new Blob([tooLarge]))).status).toBe(413);
    expect(uploadPropertyImage).not.toHaveBeenCalled();
  });

  it("answers 404 for an unknown or deleted property, without uploading", async () => {
    expect((await upload(randomUUID(), admin, new Blob([jpegBytes]))).status).toBe(404);
    const prisma = await getPrisma();
    const deleted = await prisma.property.create({
      data: {
        title: `Casa borrada imágenes ${testRunId}`,
        description: "Integration test property",
        operationType: "SALE",
        propertyType: "HOUSE",
        price: "1",
        address: "Calle 1",
        commune: "Providencia",
        city: "Santiago",
        region: "Región Metropolitana",
        deletedAt: new Date(),
      },
    });
    expect((await upload(deleted.id, admin, new Blob([jpegBytes]))).status).toBe(404);
    expect((await upload("not-a-uuid", admin, new Blob([jpegBytes]))).status).toBe(400);
    expect(uploadPropertyImage).not.toHaveBeenCalled();
  });

  it("uploads, stores URL and publicId, and replaces the seed placeholders with the first real image", async () => {
    const first = await upload(propertyId, admin, new Blob([jpegBytes]));
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ position: 0, isMain: true, url: expect.stringContaining("res.cloudinary.com") });
    // The type detected from the bytes travels to Cloudinary.
    expect(vi.mocked(uploadPropertyImage).mock.calls[0][0].type).toBe("image/jpeg");

    const second = await upload(propertyId, admin, new Blob([jpegBytes]));
    expect(second.body).toMatchObject({ position: 1, isMain: false });

    const prisma = await getPrisma();
    const images = await prisma.propertyImage.findMany({ where: { propertyId }, orderBy: { position: "asc" } });
    expect(images.map((image) => [image.publicId.startsWith("propiedades-claude/"), image.isMain])).toEqual([
      [true, true],
      [true, false],
    ]);
  });

  it("destroys the uploaded asset when it cannot be stored, keeping Cloudinary and PostgreSQL in sync", async () => {
    const prisma = await getPrisma();
    const [existing] = await prisma.propertyImage.findMany({ where: { propertyId }, take: 1 });
    // Same publicId as a stored image: the insert fails on the unique constraint.
    vi.mocked(uploadPropertyImage).mockResolvedValue({ url: existing.url, publicId: existing.publicId });

    expect((await upload(propertyId, admin, new Blob([jpegBytes]))).status).toBe(500);
    expect(destroyCloudinaryImage).toHaveBeenCalledWith(existing.publicId);
  });
});

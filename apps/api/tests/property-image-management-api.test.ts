import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { destroyCloudinaryImage, uploadPropertyImage } from "@/lib/cloudinary";
import { ApiError } from "@/lib/http/api-error";
import { MAX_PROPERTY_IMAGES } from "@portal/shared/property-image";

// Integration test (task 27): delete, order and main image, against the test database. Cloudinary is faked.
vi.mock("@/lib/cloudinary", () => ({ uploadPropertyImage: vi.fn(), destroyCloudinaryImage: vi.fn() }));

loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api/admin/properties";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-imgmgmt-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `portal_session=${createSessionToken(user.id)}`;
}

async function createProperty(images: { publicId: string; isMain?: boolean }[]) {
  const prisma = await getPrisma();
  const property = await prisma.property.create({
    data: {
      title: `Casa galería ${testRunId}`,
      description: "Integration test property",
      operationType: "SALE",
      propertyType: "HOUSE",
      price: "100000",
      address: "Calle 1",
      commune: "Providencia",
      city: "Santiago",
      region: "Región Metropolitana",
      images: {
        create: images.map((image, position) => ({
          url: `https://res.cloudinary.com/demo/image/upload/${image.publicId}.jpg`,
          publicId: image.publicId,
          position,
          isMain: image.isMain ?? false,
        })),
      },
    },
    select: { id: true, images: { select: { id: true, publicId: true }, orderBy: { position: "asc" } } },
  });
  return property;
}

async function gallery(propertyId: string) {
  const prisma = await getPrisma();
  const images = await prisma.propertyImage.findMany({ where: { propertyId }, orderBy: { position: "asc" } });
  return images.map((image) => [image.publicId.split("/").pop(), image.position, image.isMain]);
}

async function remove(propertyId: string, imageId: string, cookie?: string) {
  const { DELETE } = await import("@/app/api/admin/properties/[id]/images/[imageId]/route");
  const request = new NextRequest(`${origin}/${propertyId}/images/${imageId}`, {
    method: "DELETE",
    headers: cookie ? { cookie } : undefined,
  });
  const response = await DELETE(request, { params: Promise.resolve({ id: propertyId, imageId }) });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

async function arrange(propertyId: string, body: unknown, cookie?: string) {
  const { PUT } = await import("@/app/api/admin/properties/[id]/images/route");
  const request = new NextRequest(`${origin}/${propertyId}/images`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  const response = await PUT(request, { params: Promise.resolve({ id: propertyId }) });
  return { status: response.status, body: await response.json() };
}

const name = (suffix: string) => `propiedades-claude/${testRunId}-${suffix}`;

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("property image management API", () => {
  let admin: string;
  let user: string;

  beforeAll(async () => {
    admin = await sessionCookieFor("ADMIN");
    user = await sessionCookieFor("USER");
  });

  beforeEach(() => {
    vi.mocked(destroyCloudinaryImage).mockReset().mockResolvedValue(undefined);
    vi.mocked(uploadPropertyImage).mockReset();
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("is for ADMIN only", async () => {
    const property = await createProperty([{ publicId: name("p1"), isMain: true }]);
    const [image] = property.images;
    for (const [cookie, status] of [
      [undefined, 401],
      [user, 403],
    ] as const) {
      expect((await remove(property.id, image.id, cookie)).status).toBe(status);
      expect((await arrange(property.id, { order: [image.id], mainImageId: image.id }, cookie)).status).toBe(status);
    }
    expect(destroyCloudinaryImage).not.toHaveBeenCalled();
  });

  it("deletes an image from Cloudinary and PostgreSQL, keeping positions 0..n-1", async () => {
    const property = await createProperty([{ publicId: name("a1"), isMain: true }, { publicId: name("a2") }, { publicId: name("a3") }]);
    expect(await remove(property.id, property.images[1].id, admin)).toEqual({ status: 204, body: null });
    expect(destroyCloudinaryImage).toHaveBeenCalledWith(name("a2"));
    expect(await gallery(property.id)).toEqual([
      [`${testRunId}-a1`, 0, true],
      [`${testRunId}-a3`, 1, false],
    ]);
  });

  it("makes the first remaining image the main one when the main one is deleted", async () => {
    const property = await createProperty([{ publicId: name("b1"), isMain: true }, { publicId: name("b2") }]);
    await remove(property.id, property.images[0].id, admin);
    expect(await gallery(property.id)).toEqual([[`${testRunId}-b2`, 0, true]]);
  });

  it("changes nothing when Cloudinary fails, so the request can be retried", async () => {
    vi.mocked(destroyCloudinaryImage).mockRejectedValue(new ApiError(502, "No fue posible guardar la imagen en Cloudinary. Inténtalo de nuevo."));
    const property = await createProperty([{ publicId: name("c1"), isMain: true }]);
    expect((await remove(property.id, property.images[0].id, admin)).status).toBe(502);
    expect(await gallery(property.id)).toEqual([[`${testRunId}-c1`, 0, true]]);
  });

  it("never destroys the seed placeholders in Cloudinary: only their row goes", async () => {
    const property = await createProperty([{ publicId: `seed-placeholder/${testRunId}-1`, isMain: true }]);
    expect((await remove(property.id, property.images[0].id, admin)).status).toBe(204);
    expect(destroyCloudinaryImage).not.toHaveBeenCalled();
    expect(await gallery(property.id)).toEqual([]);
  });

  it("answers 404 for an unknown image or property, and 400 for invalid ids", async () => {
    const property = await createProperty([{ publicId: name("d1"), isMain: true }]);
    const other = await createProperty([{ publicId: name("d2"), isMain: true }]);
    // An image of another property is not found here.
    expect((await remove(property.id, other.images[0].id, admin)).status).toBe(404);
    expect((await remove(randomUUID(), property.images[0].id, admin)).status).toBe(404);
    expect((await remove(property.id, "x", admin)).status).toBe(400);
    expect(destroyCloudinaryImage).not.toHaveBeenCalled();
  });

  it("reorders the images and chooses the main one", async () => {
    const property = await createProperty([{ publicId: name("e1"), isMain: true }, { publicId: name("e2") }, { publicId: name("e3") }]);
    const [first, second, third] = property.images.map((image) => image.id);

    const { status, body } = await arrange(property.id, { order: [third, first, second], mainImageId: third }, admin);
    expect(status).toBe(200);
    expect(body.map((image: { id: string; position: number; isMain: boolean }) => [image.id, image.position, image.isMain])).toEqual([
      [third, 0, true],
      [first, 1, false],
      [second, 2, false],
    ]);
  });

  it("rejects an order that does not list exactly the property's images", async () => {
    const property = await createProperty([{ publicId: name("f1"), isMain: true }, { publicId: name("f2") }]);
    const [first, second] = property.images.map((image) => image.id);
    expect((await arrange(property.id, { order: [first], mainImageId: first }, admin)).status).toBe(409);
    expect((await arrange(property.id, { order: [first, randomUUID()], mainImageId: first }, admin)).status).toBe(409);
    expect((await arrange(property.id, { order: [first, second], mainImageId: randomUUID() }, admin)).status).toBe(400);
    expect(await gallery(property.id)).toEqual([
      [`${testRunId}-f1`, 0, true],
      [`${testRunId}-f2`, 1, false],
    ]);
  });

  it(`refuses more than ${MAX_PROPERTY_IMAGES} images per property before uploading`, async () => {
    const property = await createProperty(
      Array.from({ length: MAX_PROPERTY_IMAGES }, (_, index) => ({ publicId: name(`g${index}`), isMain: index === 0 })),
    );
    const { POST } = await import("@/app/api/admin/properties/[id]/images/route");
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])]), "foto.jpg");
    const response = await POST(
      new NextRequest(`${origin}/${property.id}/images`, { method: "POST", headers: { cookie: admin }, body: form }),
      { params: Promise.resolve({ id: property.id }) },
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Máximo 20 imágenes por propiedad", status: 409 });
    expect(uploadPropertyImage).not.toHaveBeenCalled();
  });
});

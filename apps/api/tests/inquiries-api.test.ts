import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { InquiryCreated, UserInquiry } from "@portal/shared/inquiry";

// Integration test: calls the real Route Handler against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const url = "http://localhost:3000/api/inquiries";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function postInquiry(body: unknown, rawBody?: string, cookie?: string) {
  const { POST } = await import("@/app/api/inquiries/route");
  const response = await POST(
    new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
      body: rawBody ?? JSON.stringify(body),
    }),
  );
  return { status: response.status, body: await response.json() };
}

describe.skipIf(!hasDatabaseUrl)("inquiries API", () => {
  // Every request here comes from the same "client": start each test with fresh per-IP limits.
  beforeEach(async () => (await import("@/lib/http/rate-limit")).resetRateLimits());

  let publishedId: string;
  let draftId: string;

  const validInquiry = () => ({
    propertyId: publishedId,
    name: `Visitante ${testRunId}`,
    email: "visitante@correo.cl",
    phone: "+56 9 1234 5678",
    message: "Quisiera coordinar una visita esta semana.",
  });

  beforeAll(async () => {
    const prisma = await getPrisma();
    const baseProperty = {
      description: "Integration test property",
      operationType: "SALE" as const,
      propertyType: "APARTMENT" as const,
      price: "215000",
      address: "Av. Nueva Providencia 1860",
      commune: "Providencia",
      city: "Santiago",
      region: "Región Metropolitana",
    };
    publishedId = (
      await prisma.property.create({ data: { ...baseProperty, title: `Inquiry target ${testRunId}`, isPublished: true } })
    ).id;
    draftId = (
      await prisma.property.create({ data: { ...baseProperty, title: `Inquiry draft ${testRunId}`, isPublished: false } })
    ).id;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.inquiry.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("stores a visitor's inquiry with the property title and returns 201", async () => {
    const { status, body } = await postInquiry(validInquiry());

    expect(status).toBe(201);
    const created = body as InquiryCreated;
    expect(created).toMatchObject({ propertyId: publishedId, propertyTitle: `Inquiry target ${testRunId}` });

    const prisma = await getPrisma();
    const stored = await prisma.inquiry.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored).toMatchObject({
      propertyId: publishedId,
      propertyTitle: `Inquiry target ${testRunId}`,
      userId: null,
      email: "visitante@correo.cl",
      phone: "+56 9 1234 5678",
      message: "Quisiera coordinar una visita esta semana.",
    });
  });

  it("stores no phone when it is left empty", async () => {
    const { status, body } = await postInquiry({ ...validInquiry(), phone: "" });
    expect(status).toBe(201);
    const prisma = await getPrisma();
    expect((await prisma.inquiry.findUniqueOrThrow({ where: { id: (body as InquiryCreated).id } })).phone).toBeNull();
  });

  it("returns 400 with the validation message for invalid data", async () => {
    await expect(postInquiry({ ...validInquiry(), email: "no-es-email" })).resolves.toEqual({
      status: 400,
      body: { message: "Ingresa un email válido, por ejemplo nombre@correo.cl", status: 400 },
    });
  });

  it("returns 400 for a body that is not JSON", async () => {
    await expect(postInquiry(undefined, "name=Juan")).resolves.toEqual({
      status: 400,
      body: { message: "El cuerpo de la solicitud debe ser JSON válido", status: 400 },
    });
  });

  it("returns 404 for a property that does not exist or is not published, storing nothing", async () => {
    for (const propertyId of [draftId, randomUUID()]) {
      await expect(postInquiry({ ...validInquiry(), propertyId, name: `Rechazada ${testRunId}` })).resolves.toEqual({
        status: 404,
        body: { message: "Propiedad no encontrada", status: 404 },
      });
    }
    const prisma = await getPrisma();
    expect(await prisma.inquiry.count({ where: { name: `Rechazada ${testRunId}` } })).toBe(0);
  });

  describe.skipIf(!hasAuthSecret)("with a session", () => {
    let session: { userId: string; cookie: string };

    beforeAll(async () => {
      const prisma = await getPrisma();
      const user = await prisma.user.create({
        data: { name: "Cliente", email: `cliente-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here" },
      });
      const { createSessionToken } = await import("@/lib/auth/session-token");
      session = { userId: user.id, cookie: `portal_session=${createSessionToken(user.id)}` };
    });

    async function listMine(cookie?: string) {
      const { GET } = await import("@/app/api/account/inquiries/route");
      const request = new NextRequest(
        "http://localhost:3000/api/account/inquiries",
        cookie ? { headers: { cookie } } : undefined,
      );
      const response = await GET(request);
      return { status: response.status, body: await response.json() };
    }

    it("links the inquiry to the logged-in user and lists it in their account", async () => {
      const { status, body } = await postInquiry(
        { ...validInquiry(), name: `Cliente ${testRunId}` },
        undefined,
        session.cookie,
      );
      expect(status).toBe(201);
      const created = body as InquiryCreated;

      const prisma = await getPrisma();
      expect((await prisma.inquiry.findUniqueOrThrow({ where: { id: created.id } })).userId).toBe(session.userId);

      const mine = await listMine(session.cookie);
      expect(mine.status).toBe(200);
      const [inquiry] = mine.body as UserInquiry[];
      expect(inquiry).toMatchObject({
        id: created.id,
        propertyId: publishedId,
        propertyTitle: `Inquiry target ${testRunId}`,
        message: "Quisiera coordinar una visita esta semana.",
        property: { id: publishedId, title: `Inquiry target ${testRunId}` },
      });
    });

    it("keeps a visitor's inquiry without a user, even with a forged cookie", async () => {
      const { body } = await postInquiry(validInquiry(), undefined, "portal_session=forged.token");
      const prisma = await getPrisma();
      expect((await prisma.inquiry.findUniqueOrThrow({ where: { id: (body as InquiryCreated).id } })).userId).toBeNull();
    });

    it("requires a session to list the account inquiries, and a USER account", async () => {
      expect((await listMine()).status).toBe(401);
      const prisma = await getPrisma();
      const admin = await prisma.user.create({
        data: { name: `Admin ${testRunId}`, email: `admin-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role: "ADMIN" },
      });
      const { createSessionToken } = await import("@/lib/auth/session-token");
      const adminCookie = `portal_session=${createSessionToken(admin.id)}`;
      expect((await listMine(adminCookie)).status).toBe(403);
      expect(await removeMine(randomUUID(), adminCookie)).toBe(403);
    });

    async function removeMine(id: string, cookie?: string) {
      const { DELETE } = await import("@/app/api/account/inquiries/[id]/route");
      const request = new NextRequest(`http://localhost:3000/api/account/inquiries/${id}`, {
        method: "DELETE",
        ...(cookie ? { headers: { cookie } } : {}),
      });
      return (await DELETE(request, { params: Promise.resolve({ id }) })).status;
    }

    it("removes an inquiry from the account only: it stays stored for ADMIN", async () => {
      const { body } = await postInquiry({ ...validInquiry(), name: `Cliente ${testRunId}` }, undefined, session.cookie);
      const id = (body as InquiryCreated).id;

      expect(await removeMine(id)).toBe(401);
      expect(await removeMine(id, session.cookie)).toBe(204);
      expect(((await listMine(session.cookie)).body as UserInquiry[]).map((inquiry) => inquiry.id)).not.toContain(id);

      const prisma = await getPrisma();
      expect(await prisma.inquiry.findUniqueOrThrow({ where: { id } })).toMatchObject({ hiddenByUser: true, userId: session.userId });

      // Already removed, unknown, or invalid id.
      expect(await removeMine(id, session.cookie)).toBe(404);
      expect(await removeMine(randomUUID(), session.cookie)).toBe(404);
      expect(await removeMine("not-a-uuid", session.cookie)).toBe(400);
    });

    it("cannot remove another user's or a visitor's inquiry", async () => {
      const { body } = await postInquiry(validInquiry());
      const visitorInquiryId = (body as InquiryCreated).id;
      expect(await removeMine(visitorInquiryId, session.cookie)).toBe(404);
      const prisma = await getPrisma();
      expect((await prisma.inquiry.findUniqueOrThrow({ where: { id: visitorInquiryId } })).hiddenByUser).toBe(false);
    });

    it("keeps the inquiry, without property data, once the property is unpublished", async () => {
      const prisma = await getPrisma();
      await prisma.property.update({ where: { id: publishedId }, data: { isPublished: false } });
      try {
        const [inquiry] = (await listMine(session.cookie)).body as UserInquiry[];
        expect(inquiry).toMatchObject({ propertyTitle: `Inquiry target ${testRunId}`, property: null });
      } finally {
        await prisma.property.update({ where: { id: publishedId }, data: { isPublished: true } });
      }
    });
  });
});

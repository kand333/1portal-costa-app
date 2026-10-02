import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InquiryCreated } from "@portal/shared/inquiry";

// Integration test: calls the real Route Handler against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const url = "http://localhost:3000/api/inquiries";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function postInquiry(body: unknown, rawBody?: string) {
  const { POST } = await import("@/app/api/inquiries/route");
  const response = await POST(
    new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody ?? JSON.stringify(body),
    }),
  );
  return { status: response.status, body: await response.json() };
}

describe.skipIf(!hasDatabaseUrl)("inquiries API", () => {
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
});

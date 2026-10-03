import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminInquiryDetail, AdminInquirySummary, InquiryMessage, UserInquiry, UserInquiryDetail } from "@portal/shared/inquiry";
import type { PaginatedResponse } from "@portal/shared/property";

// Integration test: the conversation after an inquiry (ADMIN ⇄ user), against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function createAccount(label: string, role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: `${label} ${testRunId}`, email: `${label}-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return { id: user.id, cookie: `portal_session=${createSessionToken(user.id)}` };
}

const request = (path: string, method: string, cookie?: string, body?: unknown) =>
  new NextRequest(`${origin}${path}`, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function adminList(query: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/inquiries/route");
  return read(await GET(request(`/api/admin/inquiries${query}`, "GET", cookie)));
}

async function adminDetail(id: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/inquiries/[id]/route");
  return read(await GET(request(`/api/admin/inquiries/${id}`, "GET", cookie), { params: Promise.resolve({ id }) }));
}

async function adminReply(id: string, body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/admin/inquiries/[id]/messages/route");
  return read(await POST(request(`/api/admin/inquiries/${id}/messages`, "POST", cookie, body), { params: Promise.resolve({ id }) }));
}

async function userDetail(id: string, cookie?: string) {
  const { GET } = await import("@/app/api/account/inquiries/[id]/route");
  return read(await GET(request(`/api/account/inquiries/${id}`, "GET", cookie), { params: Promise.resolve({ id }) }));
}

async function userReply(id: string, body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/account/inquiries/[id]/messages/route");
  return read(await POST(request(`/api/account/inquiries/${id}/messages`, "POST", cookie, body), { params: Promise.resolve({ id }) }));
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("inquiry conversation API", () => {
  let admin: { id: string; cookie: string };
  let customer: { id: string; cookie: string };
  let otherCustomer: { id: string; cookie: string };
  let customerInquiryId: string;
  let visitorInquiryId: string;

  beforeAll(async () => {
    admin = await createAccount("admin", "ADMIN");
    customer = await createAccount("cliente", "USER");
    otherCustomer = await createAccount("otro", "USER");
    const prisma = await getPrisma();
    const property = await prisma.property.create({
      data: {
        title: `Casa conversación ${testRunId}`,
        description: "Integration test property",
        operationType: "SALE",
        propertyType: "HOUSE",
        price: "100000",
        address: "Calle 1",
        commune: "Providencia",
        city: "Santiago",
        region: "Región Metropolitana",
        isPublished: true,
      },
    });
    const base = { propertyId: property.id, propertyTitle: property.title, email: "cliente@correo.cl", phone: null };
    customerInquiryId = (
      await prisma.inquiry.create({ data: { ...base, userId: customer.id, name: `Cliente ${testRunId}`, message: "¿Sigue disponible?" } })
    ).id;
    visitorInquiryId = (
      await prisma.inquiry.create({ data: { ...base, userId: null, name: `Visitante ${testRunId}`, message: "¿Aceptan mascotas?" } })
    ).id;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.inquiry.deleteMany({ where: { propertyTitle: { contains: testRunId } } });
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("protects the admin endpoints: 401 without a session, 403 for a USER", async () => {
    for (const [cookie, status] of [
      [undefined, 401],
      [customer.cookie, 403],
    ] as const) {
      expect((await adminList("", cookie)).status).toBe(status);
      expect((await adminDetail(customerInquiryId, cookie)).status).toBe(status);
      expect((await adminReply(customerInquiryId, { body: "Hola" }, cookie)).status).toBe(status);
    }
  });

  it("lists every inquiry with its contact data, searchable, waiting for an answer at first", async () => {
    const { status, body } = await adminList(`?search=conversación ${testRunId}`, admin.cookie);
    expect(status).toBe(200);
    const page = body as PaginatedResponse<AdminInquirySummary>;
    expect(page.meta.total).toBe(2);
    expect(page.data.find((row) => row.id === customerInquiryId)).toMatchObject({
      propertyTitle: `Casa conversación ${testRunId}`,
      isPropertyPublic: true,
      user: { id: customer.id, email: `cliente-${testRunId}@test.cl` },
      name: `Cliente ${testRunId}`,
      message: "¿Sigue disponible?",
      messageCount: 0,
      awaitingReply: true,
    });
    expect(page.data.find((row) => row.id === visitorInquiryId)?.user).toBeNull();
    expect(((await adminList(`?search=visitante ${testRunId}`, admin.cookie)).body as PaginatedResponse<AdminInquirySummary>).meta.total).toBe(1);
  });

  it("keeps a conversation: ADMIN answers, the user sees it and answers back", async () => {
    const reply = await adminReply(customerInquiryId, { body: "  Sí, sigue disponible.  " }, admin.cookie);
    expect(reply.status).toBe(201);
    expect(reply.body).toMatchObject({ fromAdmin: true, body: "Sí, sigue disponible.", authorName: `admin ${testRunId}` });

    // The user sees the answer in their account...
    const mine = await userDetail(customerInquiryId, customer.cookie);
    expect(mine.status).toBe(200);
    expect((mine.body as UserInquiryDetail).messages.map((message: InquiryMessage) => message.body)).toEqual(["Sí, sigue disponible."]);
    expect((mine.body as UserInquiryDetail).adminReplyCount).toBe(1);
    const { GET } = await import("@/app/api/account/inquiries/route");
    const list = (await (await GET(request("/api/account/inquiries", "GET", customer.cookie))).json()) as UserInquiry[];
    expect(list.find((inquiry) => inquiry.id === customerInquiryId)?.adminReplyCount).toBe(1);

    // ...and answers back.
    expect((await userReply(customerInquiryId, { body: "¿Puedo visitarla el sábado?" }, customer.cookie)).status).toBe(201);

    const detail = (await adminDetail(customerInquiryId, admin.cookie)).body as AdminInquiryDetail;
    expect(detail.messages.map((message) => [message.fromAdmin, message.body])).toEqual([
      [true, "Sí, sigue disponible."],
      [false, "¿Puedo visitarla el sábado?"],
    ]);
    expect(detail).toMatchObject({ messageCount: 2, awaitingReply: true });

    await adminReply(customerInquiryId, { body: "Claro, a las 11." }, admin.cookie);
    expect(((await adminDetail(customerInquiryId, admin.cookie)).body as AdminInquiryDetail).awaitingReply).toBe(false);
  });

  it("lets ADMIN answer a visitor's inquiry too (it is recorded)", async () => {
    expect((await adminReply(visitorInquiryId, { body: "Te escribimos por email." }, admin.cookie)).status).toBe(201);
    expect(((await adminDetail(visitorInquiryId, admin.cookie)).body as AdminInquiryDetail).messages).toHaveLength(1);
  });

  it("validates the reply and the ids", async () => {
    expect(await adminReply(customerInquiryId, { body: "   " }, admin.cookie)).toEqual({
      status: 400,
      body: { message: "Escribe tu respuesta", status: 400 },
    });
    expect((await adminReply(randomUUID(), { body: "Hola" }, admin.cookie)).status).toBe(404);
    expect((await adminDetail("not-a-uuid", admin.cookie)).status).toBe(400);
    expect((await userReply(customerInquiryId, { body: "" }, customer.cookie)).status).toBe(400);
  });

  it("keeps each user's conversations private, and the user endpoints are for USER accounts", async () => {
    expect((await userDetail(customerInquiryId, otherCustomer.cookie)).status).toBe(404);
    expect((await userReply(customerInquiryId, { body: "Hola" }, otherCustomer.cookie)).status).toBe(404);
    expect((await userDetail(visitorInquiryId, customer.cookie)).status).toBe(404);
    expect((await userDetail(customerInquiryId)).status).toBe(401);
    expect((await userDetail(customerInquiryId, admin.cookie)).status).toBe(403);
    expect((await userReply(customerInquiryId, { body: "Hola" }, admin.cookie)).status).toBe(403);
  });

  it("closes the conversation for the user once they remove the inquiry; ADMIN still sees it", async () => {
    const prisma = await getPrisma();
    await prisma.inquiry.update({ where: { id: customerInquiryId }, data: { hiddenByUser: true } });
    expect((await userDetail(customerInquiryId, customer.cookie)).status).toBe(404);
    expect((await userReply(customerInquiryId, { body: "Hola" }, customer.cookie)).status).toBe(404);
    expect((await adminDetail(customerInquiryId, admin.cookie)).body).toMatchObject({ hiddenByUser: true });
  });
});

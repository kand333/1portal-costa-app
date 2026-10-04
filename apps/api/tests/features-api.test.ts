import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminFeature } from "@portal/shared/feature";

// Integration test (task 28): the ADMIN feature catalog, against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api/admin/features";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-feat-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `portal_session=${createSessionToken(user.id)}`;
}

const request = (url: string, method: string, cookie?: string, body?: unknown) =>
  new NextRequest(url, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const read = async (response: Response) => ({ status: response.status, body: response.status === 204 ? null : await response.json() });

async function list(cookie?: string) {
  const { GET } = await import("@/app/api/admin/features/route");
  return read(await GET(request(origin, "GET", cookie)));
}

async function create(name: string, cookie?: string) {
  const { POST } = await import("@/app/api/admin/features/route");
  return read(await POST(request(origin, "POST", cookie, { name })));
}

async function onFeature(method: "PUT" | "DELETE", id: string, cookie?: string, body?: unknown) {
  const routes = await import("@/app/api/admin/features/[id]/route");
  return read(await routes[method](request(`${origin}/${id}`, method, cookie, body), { params: Promise.resolve({ id }) }));
}

const name = (label: string) => `${label} ${testRunId}`;

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("features API", () => {
  let admin: string;
  let user: string;

  beforeAll(async () => {
    admin = await sessionCookieFor("ADMIN");
    user = await sessionCookieFor("USER");
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.feature.deleteMany({ where: { name: { contains: testRunId, mode: "insensitive" } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  async function propertyWith(featureName: string, deletedAt: Date | null = null) {
    const prisma = await getPrisma();
    return prisma.property.create({
      data: {
        title: `Casa características ${testRunId}`,
        description: "Integration test property",
        operationType: "SALE",
        propertyType: "HOUSE",
        price: "100000",
        address: "Calle 1",
        commune: "Providencia",
        city: "Santiago",
        region: "Región Metropolitana",
        deletedAt,
        features: { create: { feature: { connect: { name: featureName } } } },
      },
    });
  }

  it("is for ADMIN only", async () => {
    for (const [cookie, status] of [
      [undefined, 401],
      [user, 403],
    ] as const) {
      expect((await list(cookie)).status).toBe(status);
      expect((await create(name("Sauna"), cookie)).status).toBe(status);
      expect((await onFeature("PUT", randomUUID(), cookie, { name: "x y" })).status).toBe(status);
      expect((await onFeature("DELETE", randomUUID(), cookie)).status).toBe(status);
    }
  });

  it("creates features without touching Property, refusing a name that exists ignoring case", async () => {
    const created = await create(`  ${name("Vista al mar")} `, admin);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: name("Vista al mar"), propertyCount: 0 });
    expect(await create(name("VISTA AL MAR"), admin)).toEqual({
      status: 409,
      body: { message: "Ya existe una característica con ese nombre", status: 409 },
    });
    expect((await create("a", admin)).status).toBe(400);
  });

  it("lists the catalog by name with how many active properties use each feature", async () => {
    await create(name("Gimnasio"), admin);
    await propertyWith(name("Gimnasio"));
    await propertyWith(name("Gimnasio"));
    await propertyWith(name("Gimnasio"), new Date());

    const { status, body } = await list(admin);
    expect(status).toBe(200);
    const feature = (body as AdminFeature[]).find((item) => item.name === name("Gimnasio"));
    // The soft-deleted property does not count.
    expect(feature?.propertyCount).toBe(2);
  });

  it("renames a feature everywhere it is used, allowing a change of case only", async () => {
    const { body } = await create(name("lavanderia"), admin);
    const id = (body as AdminFeature).id;
    const property = await propertyWith(name("lavanderia"));

    expect((await onFeature("PUT", id, admin, { name: name("Lavandería") })).body).toMatchObject({ name: name("Lavandería") });
    const prisma = await getPrisma();
    const linked = await prisma.propertyFeature.findFirstOrThrow({ where: { propertyId: property.id }, include: { feature: true } });
    expect(linked.feature.name).toBe(name("Lavandería"));

    await create(name("Terraza"), admin);
    expect((await onFeature("PUT", id, admin, { name: name("terraza") })).status).toBe(409);
    expect((await onFeature("PUT", randomUUID(), admin, { name: name("Otra") })).status).toBe(404);
    expect((await onFeature("PUT", "x", admin, { name: name("Otra") })).status).toBe(400);
  });

  it("deletes only features no active property uses, detaching soft-deleted ones", async () => {
    const used = ((await create(name("Bodega"), admin)).body as AdminFeature).id;
    await propertyWith(name("Bodega"));
    expect(await onFeature("DELETE", used, admin)).toEqual({
      status: 409,
      body: { message: `«${name("Bodega")}» está en 1 propiedad: quítala de ellas antes de eliminarla`, status: 409 },
    });

    const onlyInDeleted = ((await create(name("Quincho"), admin)).body as AdminFeature).id;
    await propertyWith(name("Quincho"), new Date());
    expect(await onFeature("DELETE", onlyInDeleted, admin)).toEqual({ status: 204, body: null });
    expect((await onFeature("DELETE", onlyInDeleted, admin)).status).toBe(404);

    const prisma = await getPrisma();
    expect(await prisma.feature.count({ where: { id: onlyInDeleted } })).toBe(0);
  });
});

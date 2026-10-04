import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminPropertyDetail, AdminPropertySummary } from "@portal/shared/admin-property";
import type { PaginatedResponse } from "@portal/shared/property";

// Integration test: the admin property CRUD against the test database, with real session cookies.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const baseUrl = "http://localhost:3000/api/admin/properties";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
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

async function readResponse(response: Response) {
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

async function list(query: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/properties/route");
  return readResponse(await GET(request(`${baseUrl}${query}`, "GET", cookie)));
}

async function create(body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/admin/properties/route");
  return readResponse(await POST(request(baseUrl, "POST", cookie, body)));
}

async function onProperty(method: "GET" | "PUT" | "DELETE", id: string, cookie?: string, body?: unknown) {
  const routes = await import("@/app/api/admin/properties/[id]/route");
  const response = await routes[method](request(`${baseUrl}/${id}`, method, cookie, body), {
    params: Promise.resolve({ id }),
  });
  return readResponse(response);
}

const validInput = () => ({
  title: `Casa admin ${testRunId}`,
  description: "Casa creada desde la administración para la prueba.",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 315000.5,
  usableArea: 140.25,
  totalArea: 300,
  bedrooms: 4,
  bathrooms: 3,
  parkingSpaces: 0,
  ageInYears: 0,
  address: "Av. Prueba 123",
  commune: `Comunaadmin${testRunId}`,
  city: "Santiago",
  region: "Región Metropolitana",
  features: [`Piscina ${testRunId}`, `quincho ${testRunId}`],
});

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin properties API", () => {
  let admin: string;
  let user: string;

  beforeAll(async () => {
    admin = await sessionCookieFor("ADMIN");
    user = await sessionCookieFor("USER");
    // An existing feature with another case: it must be reused, not duplicated.
    const prisma = await getPrisma();
    await prisma.feature.create({ data: { name: `Quincho ${testRunId}` } });
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.feature.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.inquiry.deleteMany({ where: { propertyTitle: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("protects every endpoint: 401 without a session, 403 for a USER", async () => {
    const someId = randomUUID();
    for (const [cookie, status] of [
      [undefined, 401],
      [user, 403],
    ] as const) {
      expect((await list("", cookie)).status).toBe(status);
      expect((await create(validInput(), cookie)).status).toBe(status);
      expect((await onProperty("GET", someId, cookie)).status).toBe(status);
      expect((await onProperty("PUT", someId, cookie, validInput())).status).toBe(status);
      expect((await onProperty("DELETE", someId, cookie)).status).toBe(status);
    }
  });

  it("creates an unpublished property with its features, reusing an existing one ignoring case", async () => {
    const { status, body } = await create(validInput(), admin);
    expect(status).toBe(201);
    const created = body as AdminPropertyDetail;
    expect(created).toMatchObject({
      title: `Casa admin ${testRunId}`,
      price: 315000.5,
      usableArea: 140.25,
      parkingSpaces: 0,
      ageInYears: 0,
      isPublished: false,
      isFeatured: false,
      images: [],
    });
    expect(created.features).toEqual([`Piscina ${testRunId}`, `Quincho ${testRunId}`]);

    const prisma = await getPrisma();
    expect(await prisma.feature.count({ where: { name: { contains: `uincho ${testRunId}`, mode: "insensitive" } } })).toBe(1);
  });

  it("rejects invalid data with the validation message", async () => {
    expect(await create({ ...validInput(), price: 0 }, admin)).toEqual({
      status: 400,
      body: { message: "El precio debe ser mayor que 0", status: 400 },
    });
  });

  it("lists every property, published or not, with search and pagination", async () => {
    await create({ ...validInput(), title: `Depto admin ${testRunId}`, isPublished: true, features: [] }, admin);

    const { status, body } = await list(`?search=comunaadmin${testRunId}&pageSize=1`, admin);
    expect(status).toBe(200);
    const page = body as PaginatedResponse<AdminPropertySummary>;
    expect(page.meta).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2 });
    expect(page.data[0]).toMatchObject({ title: `Depto admin ${testRunId}`, isPublished: true });

    const secondPage = (await list(`?search=comunaadmin${testRunId}&pageSize=1&page=2`, admin)).body as PaginatedResponse<AdminPropertySummary>;
    expect(secondPage.data[0]).toMatchObject({ title: `Casa admin ${testRunId}`, isPublished: false });
  });

  it("combines the list filters (AND): status, operation, type, price, city and creation day", async () => {
    const prisma = await getPrisma();
    const base = { ...validInput(), features: [], commune: `Filtros${testRunId}` };
    const ids = {
      publishedSale: ((await create({ ...base, title: `F venta ${testRunId}`, isPublished: true, city: "Ñuñoa Alta", price: 100000 }, admin)).body as AdminPropertyDetail).id,
      draftRent: ((await create({ ...base, title: `F arriendo ${testRunId}`, operationType: "RENT", propertyType: "APARTMENT", price: 900 }, admin)).body as AdminPropertyDetail).id,
      old: ((await create({ ...base, title: `F antigua ${testRunId}`, isPublished: true, price: 500000 }, admin)).body as AdminPropertyDetail).id,
    };
    await prisma.property.update({ where: { id: ids.old }, data: { createdAt: new Date("2025-01-15T12:00:00.000Z") } });

    const titles = async (filters: string) => {
      const { status, body } = await list(`?search=filtros${testRunId}${filters}`, admin);
      expect(status).toBe(200);
      return (body as PaginatedResponse<AdminPropertySummary>).data.map((row) => row.title).sort();
    };

    expect(await titles("")).toHaveLength(3);
    expect(await titles("&status=published")).toEqual([`F antigua ${testRunId}`, `F venta ${testRunId}`]);
    expect(await titles("&status=draft")).toEqual([`F arriendo ${testRunId}`]);
    expect(await titles("&operation=RENT&type=APARTMENT")).toEqual([`F arriendo ${testRunId}`]);
    expect(await titles("&minPrice=1000&maxPrice=200000")).toEqual([`F venta ${testRunId}`]);
    // The city slug accepts the stored spelling with accents.
    expect(await titles("&city=nunoa-alta")).toEqual([`F venta ${testRunId}`]);
    expect(await titles("&createdFrom=2025-01-15&createdTo=2025-01-15")).toEqual([`F antigua ${testRunId}`]);
    expect(await titles("&createdFrom=2025-01-16")).toHaveLength(2);
    expect(await titles("&status=published&minPrice=200000")).toEqual([`F antigua ${testRunId}`]);

    expect((await list("?minPrice=5&maxPrice=1", admin)).status).toBe(400);
    expect((await list("?createdFrom=2026-02-30", admin)).status).toBe(400);
  });

  it("gets, replaces and publishes a property; the public catalog then finds it", async () => {
    const { body } = await create(validInput(), admin);
    const id = (body as AdminPropertyDetail).id;

    expect((await onProperty("GET", id, admin)).body).toMatchObject({ id, isPublished: false });

    const updated = await onProperty("PUT", id, admin, {
      ...validInput(),
      title: `Casa editada ${testRunId}`,
      bedrooms: null,
      isPublished: true,
      isFeatured: true,
      features: [`Terraza ${testRunId}`],
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      title: `Casa editada ${testRunId}`,
      bedrooms: null,
      isPublished: true,
      isFeatured: true,
      features: [`Terraza ${testRunId}`],
    });

    // Published now: the public detail answers, and the search text was refreshed by the trigger.
    const publicRoute = await import("@/app/api/properties/[id]/route");
    const publicDetail = await publicRoute.GET(new NextRequest(`http://localhost:3000/api/properties/${id}`), {
      params: Promise.resolve({ id }),
    });
    expect(publicDetail.status).toBe(200);
    const publicList = await import("@/app/api/properties/route");
    const found = await (await publicList.GET(new NextRequest(`http://localhost:3000/api/properties?search=editada ${testRunId}`))).json();
    expect(found.data.map((property: { id: string }) => property.id)).toContain(id);
  });

  it("soft-deletes a property: 204, then hidden everywhere except the deleted list", async () => {
    const { body } = await create({ ...validInput(), title: `Casa borrada ${testRunId}`, isPublished: true }, admin);
    const id = (body as AdminPropertyDetail).id;
    const prisma = await getPrisma();
    const owner = await prisma.user.findFirstOrThrow({ where: { email: `user-${testRunId}@test.cl` } });
    const userId = owner.id;
    const authUser = { id: owner.id, name: owner.name, email: owner.email, role: owner.role, isActive: owner.isActive };
    await prisma.favorite.create({ data: { userId, propertyId: id } });
    await prisma.inquiry.create({
      data: { propertyId: id, propertyTitle: `Casa borrada ${testRunId}`, userId, name: "USER", email: owner.email, message: "Consulta de prueba" },
    });

    expect(await onProperty("DELETE", id, admin)).toEqual({ status: 204, body: null });

    // The row stays, stamped, with its related rows.
    const stored = await prisma.property.findUniqueOrThrow({ where: { id }, include: { features: true, favorites: true } });
    expect(stored.deletedAt).toBeInstanceOf(Date);
    expect(stored.features).toHaveLength(2);
    expect(stored.favorites).toHaveLength(1);

    // ADMIN can no longer open, edit or delete it again.
    expect((await onProperty("GET", id, admin)).status).toBe(404);
    expect((await onProperty("PUT", id, admin, validInput())).status).toBe(404);
    expect((await onProperty("DELETE", id, admin)).status).toBe(404);

    // Only the deleted list shows it, with the deletion date.
    const active = (await list(`?search=borrada ${testRunId}`, admin)).body as PaginatedResponse<AdminPropertySummary>;
    expect(active.meta.total).toBe(0);
    const deleted = (await list(`?search=borrada ${testRunId}&status=deleted`, admin)).body as PaginatedResponse<AdminPropertySummary>;
    expect(deleted.data).toEqual([expect.objectContaining({ id, deletedAt: stored.deletedAt?.toISOString() })]);
    expect((await list("?status=trash", admin)).status).toBe(400);

    // Public detail, the user's favorites and the user's inquiries hide it (the inquiry keeps its title).
    const publicRoute = await import("@/app/api/properties/[id]/route");
    const publicDetail = await publicRoute.GET(new NextRequest(`http://localhost:3000/api/properties/${id}`), {
      params: Promise.resolve({ id }),
    });
    expect(publicDetail.status).toBe(404);
    const { listFavorites } = await import("@/services/favorite-service");
    expect((await listFavorites(authUser)).map((property) => property.id)).not.toContain(id);
    const { listUserInquiries } = await import("@/services/inquiry-service");
    expect(await listUserInquiries(authUser)).toEqual([
      expect.objectContaining({ propertyId: id, propertyTitle: `Casa borrada ${testRunId}`, property: null }),
    ]);
  });

  it("does not count soft-deleted properties in the dashboard", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    const totalOf = async () => (await (await GET(request("http://localhost:3000/api/admin/dashboard", "GET", admin))).json()).properties.total;
    const before = await totalOf();
    const { body } = await create(validInput(), admin);
    expect(await totalOf()).toBe(before + 1);
    await onProperty("DELETE", (body as AdminPropertyDetail).id, admin);
    expect(await totalOf()).toBe(before);
  });

  it("answers 404 for an unknown property and 400 for an invalid id", async () => {
    const notFound = { status: 404, body: { message: "Propiedad no encontrada", status: 404 } };
    expect(await onProperty("GET", randomUUID(), admin)).toEqual(notFound);
    expect(await onProperty("PUT", randomUUID(), admin, validInput())).toEqual(notFound);
    expect((await onProperty("GET", "not-a-uuid", admin)).status).toBe(400);
  });
});

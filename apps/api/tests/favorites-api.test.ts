import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PropertySummary } from "@portal/shared/property";

// Integration test: the favorites endpoints against the test database, with real session cookies.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const baseUrl = "http://localhost:3000/api/favorites";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(label: string, role: "USER" | "ADMIN" = "USER") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: label, email: `${label}-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `portal_session=${createSessionToken(user.id)}`;
}

async function listFavorites(cookie?: string) {
  const { GET } = await import("@/app/api/favorites/route");
  const response = await GET(new NextRequest(baseUrl, cookie ? { headers: { cookie } } : undefined));
  return { status: response.status, body: await response.json() };
}

async function changeFavorite(method: "POST" | "DELETE", propertyId: string, cookie?: string) {
  const routes = await import("@/app/api/favorites/[propertyId]/route");
  const request = new NextRequest(`${baseUrl}/${propertyId}`, { method, headers: cookie ? { cookie } : undefined });
  const response = await routes[method](request, { params: Promise.resolve({ propertyId }) });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

const idsOf = (body: PropertySummary[]) => body.map((property) => property.id);

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("favorites API", () => {
  let owner: string;
  let otherUser: string;
  let firstId: string;
  let secondId: string;
  let draftId: string;

  beforeAll(async () => {
    const prisma = await getPrisma();
    owner = await sessionCookieFor("owner");
    otherUser = await sessionCookieFor("other");
    const base = {
      description: "Integration test property",
      operationType: "SALE" as const,
      propertyType: "APARTMENT" as const,
      price: "100000",
      address: "Calle 1",
      commune: "Providencia",
      city: "Santiago",
      region: "Región Metropolitana",
    };
    firstId = (await prisma.property.create({ data: { ...base, title: `First ${testRunId}`, isPublished: true } })).id;
    secondId = (await prisma.property.create({ data: { ...base, title: `Second ${testRunId}`, isPublished: true } })).id;
    draftId = (await prisma.property.create({ data: { ...base, title: `Draft ${testRunId}`, isPublished: false } })).id;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("requires a session", async () => {
    expect((await listFavorites()).status).toBe(401);
    expect((await changeFavorite("POST", firstId)).status).toBe(401);
    expect((await changeFavorite("DELETE", firstId)).status).toBe(401);
  });

  it("is for USER accounts only: 403 for an ADMIN", async () => {
    const admin = await sessionCookieFor("admin", "ADMIN");
    expect((await listFavorites(admin)).status).toBe(403);
    expect((await changeFavorite("POST", firstId, admin)).status).toBe(403);
    expect((await changeFavorite("DELETE", firstId, admin)).status).toBe(403);
  });

  it("starts empty, then lists saved properties, most recent first", async () => {
    expect(await listFavorites(owner)).toEqual({ status: 200, body: [] });

    expect((await changeFavorite("POST", firstId, owner)).status).toBe(204);
    expect((await changeFavorite("POST", secondId, owner)).status).toBe(204);

    const { status, body } = await listFavorites(owner);
    expect(status).toBe(200);
    expect(idsOf(body)).toEqual([secondId, firstId]);
    expect(body[0]).toMatchObject({ title: `Second ${testRunId}`, mainImageUrl: null });
  });

  it("does not duplicate a property saved twice", async () => {
    expect((await changeFavorite("POST", firstId, owner)).status).toBe(204);
    const prisma = await getPrisma();
    expect(await prisma.favorite.count({ where: { propertyId: firstId } })).toBe(1);
  });

  it("keeps each user's favorites separate", async () => {
    expect(await listFavorites(otherUser)).toEqual({ status: 200, body: [] });
  });

  it("removes a favorite, and removing it again is harmless", async () => {
    expect((await changeFavorite("DELETE", firstId, owner)).status).toBe(204);
    expect((await changeFavorite("DELETE", firstId, owner)).status).toBe(204);
    expect(idsOf((await listFavorites(owner)).body)).toEqual([secondId]);
  });

  it("rejects unpublished or unknown properties and invalid ids", async () => {
    const notFound = { status: 404, body: { message: "Propiedad no encontrada", status: 404 } };
    expect(await changeFavorite("POST", draftId, owner)).toEqual(notFound);
    expect(await changeFavorite("POST", randomUUID(), owner)).toEqual(notFound);
    expect((await changeFavorite("POST", "not-a-uuid", owner)).status).toBe(400);
  });

  it("hides a saved property once it is unpublished", async () => {
    const prisma = await getPrisma();
    await prisma.property.update({ where: { id: secondId }, data: { isPublished: false } });
    expect(idsOf((await listFavorites(owner)).body)).toEqual([]);
  });
});

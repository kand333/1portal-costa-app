import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminDashboardStats } from "@portal/shared/admin";

// Integration test: the dashboard counts against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);

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

async function getDashboard(cookie?: string) {
  const { GET } = await import("@/app/api/admin/dashboard/route");
  const response = await GET(
    new NextRequest("http://localhost:3000/api/admin/dashboard", cookie ? { headers: { cookie } } : undefined),
  );
  return { status: response.status, body: await response.json() };
}

/** Counts computed directly, to compare with the endpoint (other test files may add rows). */
async function expectedStats(): Promise<AdminDashboardStats> {
  const prisma = await getPrisma();
  return {
    properties: {
      total: await prisma.property.count(),
      published: await prisma.property.count({ where: { isPublished: true } }),
      forSale: await prisma.property.count({ where: { operationType: "SALE" } }),
      forRent: await prisma.property.count({ where: { operationType: "RENT" } }),
    },
    users: await prisma.user.count(),
    inquiries: await prisma.inquiry.count(),
  };
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin dashboard API", () => {
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
    const prisma = await getPrisma();
    const base = {
      description: "Integration test property",
      propertyType: "HOUSE" as const,
      price: "100000",
      address: "Calle 1",
      commune: "Ñuñoa",
      city: "Santiago",
      region: "Región Metropolitana",
    };
    const property = await prisma.property.create({
      data: { ...base, title: `Sale ${testRunId}`, operationType: "SALE", isPublished: true },
    });
    await prisma.property.create({ data: { ...base, title: `Rent ${testRunId}`, operationType: "RENT" } });
    await prisma.inquiry.create({
      data: {
        propertyId: property.id,
        propertyTitle: property.title,
        name: `Lead ${testRunId}`,
        email: "lead@test.cl",
        message: "Consulta de prueba",
      },
    });
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.inquiry.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session and 403 to a USER", async () => {
    expect((await getDashboard()).status).toBe(401);
    expect(await getDashboard(userCookie)).toEqual({
      status: 403,
      body: { message: "No tienes permisos para realizar esta acción", status: 403 },
    });
  });

  it("gives an ADMIN the counts of properties (also unpublished), users and inquiries", async () => {
    const { status, body } = await getDashboard(adminCookie);
    expect(status).toBe(200);
    expect(body).toEqual(await expectedStats());

    const stats = body as AdminDashboardStats;
    expect(stats.properties.total).toBeGreaterThanOrEqual(2);
    expect(stats.properties.forSale + stats.properties.forRent).toBe(stats.properties.total);
    expect(stats.properties.published).toBeLessThan(stats.properties.total);
    expect(stats.users).toBeGreaterThanOrEqual(2);
    expect(stats.inquiries).toBeGreaterThanOrEqual(1);
  });
});

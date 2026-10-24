import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminLeadSummary } from "@portal/shared/lead";
import type { PaginatedResponse } from "@portal/shared/property";

// Integration test: ADMIN lead list, against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function createAccount(label: string, role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: `${label} ${testRunId}`, email: `${label.toLowerCase()}-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `portal_session=${createSessionToken(user.id)}`;
}

async function list(query: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/leads/route");
  const response = await GET(new NextRequest(`http://localhost:3000/api/admin/leads${query}`, { headers: cookie ? { cookie } : {} }));
  return { status: response.status, body: await response.json() };
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin leads API", () => {
  let adminCookie: string;
  let userCookie: string;
  const email = `lead-admin-${testRunId}@correo.cl`;

  beforeAll(async () => {
    adminCookie = await createAccount("Jefa", "ADMIN");
    userCookie = await createAccount("Ana", "USER");
    const prisma = await getPrisma();
    await prisma.lead.createMany({
      data: [
        { kind: "VALUATION", name: "Uno", email, address: "Barros Arana 1000", commune: "Concepción", source: "home-hero" },
        { kind: "SEARCH", name: "Dos", email, operation: "RENT", source: "home-closing" },
      ],
    });
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.lead.deleteMany({ where: { email } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("is for ADMIN only", async () => {
    expect((await list("")).status).toBe(401);
    expect((await list("", userCookie)).status).toBe(403);
  });

  it("lists leads newest first with pagination", async () => {
    const { status, body } = await list("?pageSize=1", adminCookie);
    expect(status).toBe(200);
    const page = body as PaginatedResponse<AdminLeadSummary>;
    expect(page.data).toHaveLength(1);
    expect(page.meta.total).toBeGreaterThanOrEqual(2);
    expect(page.data[0]).toMatchObject({ email, source: "home-closing", kind: "SEARCH", user: null, createdAt: expect.any(String) });
  });
});

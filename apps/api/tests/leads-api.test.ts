import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { LeadCreated } from "@portal/shared/lead";

// Integration test: calls the real Route Handler against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const url = "http://localhost:3000/api/leads";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function postLead(body: unknown, rawBody?: string) {
  const { POST } = await import("@/app/api/leads/route");
  const response = await POST(
    new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody ?? JSON.stringify(body),
    }),
  );
  return { status: response.status, body: await response.json() };
}

describe.skipIf(!hasDatabaseUrl)("leads API", () => {
  // Every request here comes from the same "client": start each test with fresh per-IP limits.
  beforeEach(async () => (await import("@/lib/http/rate-limit")).resetRateLimits());

  const email = `lead-${testRunId}@correo.cl`;
  const validLead = () => ({
    kind: "VALUATION",
    source: "home-hero",
    name: `Visitante ${testRunId}`,
    email,
    phone: "+56 9 1234 5678",
    address: "Barros Arana 1000",
    commune: "Concepción",
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.lead.deleteMany({ where: { email } });
  });

  it("stores a visitor's lead and answers 201", async () => {
    const { status, body } = await postLead(validLead());
    expect(status).toBe(201);
    const created = body as LeadCreated;
    expect(created.kind).toBe("VALUATION");

    const stored = await (await getPrisma()).lead.findUnique({ where: { id: created.id } });
    expect(stored).toMatchObject({ email, commune: "Concepción", address: "Barros Arana 1000", userId: null, source: "home-hero" });
  });

  it("stores the source of the valuation page", async () => {
    const { status, body } = await postLead({ ...validLead(), source: "tasador" });
    expect(status).toBe(201);
    const stored = await (await getPrisma()).lead.findUnique({ where: { id: (body as LeadCreated).id } });
    expect(stored?.source).toBe("tasador");
  });

  it("rejects invalid data with 400 and stores nothing", async () => {
    expect((await postLead({ ...validLead(), email: "nope" })).status).toBe(400);
    expect((await postLead({ ...validLead(), address: undefined })).status).toBe(400);
    expect((await postLead(null, "not json")).status).toBe(400);
  });

  it("answers 201 to the honeypot without storing the lead", async () => {
    const honeypotEmail = `bot-${testRunId}@correo.cl`;
    const { status } = await postLead({ ...validLead(), email: honeypotEmail, website: "https://spam.example" });
    expect(status).toBe(201);
    expect(await (await getPrisma()).lead.count({ where: { email: honeypotEmail } })).toBe(0);
  });

  it("limits requests per client with 429", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await postLead({ ...validLead(), email: "nope" })).status).toBe(400);
    }
    expect((await postLead(validLead())).status).toBe(429);
  });
});

import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ValuationResult } from "@portal/shared/valuation";

// The value of the UF comes from the network: fixed here so the test is deterministic.
const ufValue = vi.hoisted(() => ({ current: 40_000 as number | null }));
vi.mock("@/lib/uf-value", () => ({ getUfValue: async () => ufValue.current }));

// Integration test: calls the real Route Handler against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const commune = `Comuna ${testRunId}`;
const url = "http://localhost:3000/api/valuations";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function postValuation(body: unknown, rawBody?: string) {
  const { POST } = await import("@/app/api/valuations/route");
  const response = await POST(
    new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody ?? JSON.stringify(body),
    }),
  );
  return { status: response.status, body: await response.json() };
}

const validRequest = () => ({
  address: "Barros Arana 1000",
  commune,
  propertyType: "APARTMENT",
  operation: "SALE",
  totalArea: 100,
  usableArea: 100,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  constructionYear: 2010,
  amenities: [] as string[],
});

describe.skipIf(!hasDatabaseUrl)("valuations API", () => {
  beforeEach(async () => {
    ufValue.current = 40_000;
    (await import("@/lib/http/rate-limit")).resetRateLimits();
  });

  beforeAll(async () => {
    const prisma = await getPrisma();
    const base = {
      description: "Integration test property",
      propertyType: "APARTMENT" as const,
      operationType: "SALE" as const,
      usableArea: "100",
      totalArea: "100",
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      address: "Calle 1",
      commune,
      city: "Concepción",
      region: "Biobío",
    };
    // Three published comparables of 100 m² at 100, 120 and 140 million; a draft and a deleted one must not count.
    for (const [index, price] of [100_000_000, 120_000_000, 140_000_000].entries()) {
      await prisma.property.create({
        data: { ...base, title: `Comparable ${index} ${testRunId}`, price: String(price), isPublished: true },
      });
    }
    await prisma.property.create({ data: { ...base, title: `Draft ${testRunId}`, price: "900000000", isPublished: false } });
    await prisma.property.create({
      data: { ...base, title: `Deleted ${testRunId}`, price: "900000000", isPublished: true, deletedAt: new Date() },
    });
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { commune } });
  });

  it("blends the published properties of the commune with the sector reference", async () => {
    const { status, body } = await postValuation(validRequest());
    expect(status).toBe(200);
    const result = body as Extract<ValuationResult, { status: "ok" }>;
    expect(result).toMatchObject({ status: "ok", comparablesCount: 3, scope: "commune", basis: "mixed", confidence: "medium" });
    expect(result.low).toBeLessThan(result.estimate);
    expect(result.estimate).toBeLessThan(result.high);
    expect(result.uf).toMatchObject({ value: 40_000 });
  });

  it("always gives a figure, even with no comparables at all (a house for rent)", async () => {
    const { status, body } = await postValuation({ ...validRequest(), propertyType: "HOUSE", operation: "RENT", commune: "Penco" });
    expect(status).toBe(200);
    const result = body as Extract<ValuationResult, { status: "ok" }>;
    expect(result).toMatchObject({ status: "ok", basis: "reference", confidence: "low", comparablesCount: 0, uf: null });
    expect(result.estimate).toBeGreaterThan(0);
  });

  it("prices by the sector nearest to the located address", async () => {
    const expensive = (await postValuation({ ...validRequest(), propertyType: "HOUSE", commune: "Concepción", latitude: -36.792, longitude: -73.058 })).body as ValuationResult;
    const cheap = (await postValuation({ ...validRequest(), propertyType: "HOUSE", commune: "Concepción", latitude: -36.826, longitude: -73.056 })).body as ValuationResult;
    expect(expensive.status === "ok" && expensive.sector).toBe("Lomas de San Andrés");
    expect(cheap.status === "ok" && cheap.sector).toBe("Bajo Tucapel");
    expect(expensive.estimate).toBeGreaterThan(cheap.estimate);
  });

  it("values a newer building higher than an old one", async () => {
    const recent = (await postValuation({ ...validRequest(), constructionYear: new Date().getFullYear() - 1 })).body as ValuationResult;
    const old = (await postValuation({ ...validRequest(), constructionYear: 1950 })).body as ValuationResult;
    expect(recent.estimate).toBeGreaterThan(old.estimate);
  });

  it("asks for the construction year", async () => {
    const { constructionYear: _omitted, ...withoutYear } = validRequest();
    expect((await postValuation(withoutYear)).status).toBe(400);
  });

  it("raises the price with amenities", async () => {
    const plain = (await postValuation(validRequest())).body as ValuationResult;
    const equipped = (await postValuation({ ...validRequest(), amenities: ["pool", "gym"] })).body as ValuationResult;
    expect(plain.status === "ok" && equipped.status === "ok" && equipped.estimate > plain.estimate).toBe(true);
  });

  it("gives no UF figures when the UF is unavailable or for a rent", async () => {
    ufValue.current = null;
    expect(((await postValuation(validRequest())).body as { uf: unknown }).uf).toBeNull();
    ufValue.current = 40_000;
    const rent = await postValuation({ ...validRequest(), operation: "RENT" });
    // No rent comparables in the commune, so it widens to the portal; any "ok" rent answer has no UF.
    expect((rent.body as ValuationResult).uf).toBeNull();
  });

  it("rejects an unknown amenity", async () => {
    expect((await postValuation({ ...validRequest(), amenities: ["sauna"] })).status).toBe(400);
  });

  it("widens to the whole portal when the commune has no comparables", async () => {
    const { status, body } = await postValuation({ ...validRequest(), commune: `Otra ${testRunId}` });
    expect(status).toBe(200);
    const result = body as ValuationResult;
    // The three comparables above count for every commune at portal scope.
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.scope).toBe("portal");
  });

  it("rejects invalid data with 400", async () => {
    expect((await postValuation({ ...validRequest(), usableArea: 500 })).status).toBe(400);
    expect((await postValuation({ ...validRequest(), propertyType: "LAND" })).status).toBe(400);
    expect((await postValuation({}, "not json")).status).toBe(400);
  });

  it("limits repeated estimates with 429", async () => {
    let last = 0;
    for (let attempt = 0; attempt < 31; attempt += 1) last = (await postValuation(validRequest())).status;
    expect(last).toBe(429);
  });
});

import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ValuationCityDto, ValuationSectorDto } from "@portal/shared/valuation-sector";

// The value of the UF is fixed so the estimate never waits for the network.
vi.mock("@/lib/uf-value", () => ({ getUfValue: async () => 40_000 }));

// Integration test: the ADMIN reference table of the price estimator, against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api/admin/valuation-sectors";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-sect-${testRunId}@test.cl`, passwordHash: "scrypt$not-used-here", role },
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

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function list(cookie?: string) {
  const { GET } = await import("@/app/api/admin/valuation-sectors/route");
  return read(await GET(request(origin, "GET", cookie)));
}

async function createCity(body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/admin/valuation-sectors/cities/route");
  return read(await POST(request(`${origin}/cities`, "POST", cookie, body)));
}

async function patchCity(id: string, body: unknown, cookie?: string) {
  const { PATCH } = await import("@/app/api/admin/valuation-sectors/cities/[id]/route");
  return read(await PATCH(request(`${origin}/cities/${id}`, "PATCH", cookie, body), { params: Promise.resolve({ id }) }));
}

async function createSector(body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/admin/valuation-sectors/route");
  return read(await POST(request(origin, "POST", cookie, body)));
}

async function patchSector(id: string, body: unknown, cookie?: string) {
  const { PATCH } = await import("@/app/api/admin/valuation-sectors/[id]/route");
  return read(await PATCH(request(`${origin}/${id}`, "PATCH", cookie, body), { params: Promise.resolve({ id }) }));
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("valuation sectors API", () => {
  let admin: string;
  let user: string;
  const cityName = `Ciudad ${testRunId}`;
  const base = { houseUfPerM2: 30, apartmentUfPerM2: 35, landUfPerM2: 5 };

  beforeAll(async () => {
    admin = await sessionCookieFor("ADMIN");
    user = await sessionCookieFor("USER");
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.valuationCity.deleteMany({ where: { name: cityName } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("is for ADMIN only", async () => {
    expect((await list()).status).toBe(401);
    expect((await list(user)).status).toBe(403);
    expect((await createCity({ name: cityName, ...base }, user)).status).toBe(403);
  });

  it("ships the calibrated table: Concepción with its 12 portal barrios, San Pedro de la Paz with 5 and the other communes", async () => {
    const { status, body } = await list(admin);
    expect(status).toBe(200);
    const cities = body as ValuationCityDto[];
    const concepcion = cities.find((city) => city.name === "Concepción");
    expect(concepcion?.sectors).toHaveLength(12);
    expect(concepcion?.sectors.some((sector) => sector.source === "muestreo")).toBe(true);
    expect(cities.find((city) => city.name === "San Pedro de la Paz")?.sectors).toHaveLength(5);
    expect(concepcion?.sectors.every((sector) => sector.commune === "Concepción" && sector.coefficient > 0)).toBe(true);
    expect(cities.map((city) => city.name)).toEqual(expect.arrayContaining(["San Pedro de la Paz", "Talcahuano", "Penco", "Lota"]));
  });

  it("adds a city, edits its base prices, adds and edits a sector, and rejects duplicates and bad data", async () => {
    const created = await createCity({ name: cityName, ...base }, admin);
    expect(created.status).toBe(201);
    const city = created.body as ValuationCityDto;
    expect((await createCity({ name: cityName, ...base }, admin)).status).toBe(409);
    expect((await createCity({ name: cityName, ...base, houseUfPerM2: 0 }, admin)).status).toBe(400);

    const changed = await patchCity(city.id, { houseUfPerM2: 33, apartmentUfPerM2: 36, landUfPerM2: 6 }, admin);
    expect(changed.body).toMatchObject({ houseUfPerM2: 33, apartmentUfPerM2: 36, landUfPerM2: 6 });
    expect((await patchCity(randomUUID(), base, admin)).status).toBe(404);

    const sectorBody = { cityId: city.id, name: "Centro", commune: cityName, latitude: -36.8, longitude: -73, coefficient: 1.1, source: "estimado" };
    const addedSector = await createSector(sectorBody, admin);
    expect(addedSector.status).toBe(201);
    const sector = addedSector.body as ValuationSectorDto;
    expect((await createSector(sectorBody, admin)).status).toBe(409);
    expect((await createSector({ ...sectorBody, name: "Otro", coefficient: 9 }, admin)).status).toBe(400);

    const edited = await patchSector(sector.id, { coefficient: 1.25, source: "muestreo", note: "Revisado" }, admin);
    expect(edited.body).toMatchObject({ coefficient: 1.25, source: "muestreo", note: "Revisado" });
    expect((await patchSector(randomUUID(), { coefficient: 1 }, admin)).status).toBe(404);
    expect((await patchSector("no-es-uuid", { coefficient: 1 }, admin)).status).toBe(400);
  });

  it("changes the estimate when a coefficient changes", async () => {
    const prisma = await getPrisma();
    const city = await prisma.valuationCity.findFirstOrThrow({ where: { name: cityName }, include: { sectors: true } });
    const { estimateValuation } = await import("@/services/valuation-service");
    const ask = () =>
      estimateValuation({
        address: "Calle 1",
        commune: cityName,
        propertyType: "HOUSE",
        operation: "RENT",
        totalArea: 100,
        usableArea: 100,
        bedrooms: 3,
        bathrooms: 2,
        parkingSpaces: 1,
        constructionYear: 2011,
        amenities: [],
      });
    const before = await ask();
    await patchSector(city.sectors[0]!.id, { coefficient: 2 }, admin);
    const after = await ask();
    expect(before.status === "ok" && after.status === "ok" && after.estimate > before.estimate).toBe(true);
  });
});

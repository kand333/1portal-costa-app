import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

// Integration test: catalog sort orders through the real Route Handler against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const run = randomUUID().slice(0, 8);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function list(query: string) {
  const { GET } = await import("@/app/api/properties/route");
  const response = await GET(new NextRequest(`http://localhost:3000/api/properties?${query}`));
  return { status: response.status, body: (await response.json()) as PaginatedResponse<PropertySummary> };
}

type Fixture = Omit<Prisma.PropertyCreateInput, "description" | "address" | "isPublished" | "title"> & {
  label: string;
};

// Distinct prices and areas; createdAt goes from oldest (a) to newest (f) so "newest" is f..a.
const fixtures: Fixture[] = [
  { label: "a", price: "300", usableArea: "50", totalArea: "60", createdAt: "2026-01-01T00:00:00Z" },
  { label: "b", price: "100", usableArea: "120", totalArea: "130", createdAt: "2026-01-02T00:00:00Z" },
  { label: "c", price: "200", usableArea: "80", totalArea: "90", createdAt: "2026-01-03T00:00:00Z" },
  // Land: no usable area, only total area (the biggest of all).
  { label: "land-big", price: "50", totalArea: "5000", createdAt: "2026-01-04T00:00:00Z" },
  { label: "land-small", price: "70", totalArea: "400", createdAt: "2026-01-05T00:00:00Z" },
  // Same price as "c" (200): their order must still be stable.
  { label: "f", price: "200", usableArea: "80", totalArea: "95", createdAt: "2026-01-06T00:00:00Z" },
].map((fixture) => ({
  ...fixture,
  operationType: "SALE",
  propertyType: "HOUSE",
  commune: "Sort Test",
  city: "Sort Test",
  region: "Sort Test",
})) as Fixture[];

describe.skipIf(!hasDatabaseUrl)("catalog sort orders", () => {
  beforeAll(async () => {
    const prisma = await getPrisma();
    for (const { label, ...data } of fixtures) {
      await prisma.property.create({
        data: { ...data, title: `${label} ${run}`, description: "Sort test", address: "Calle 1", isPublished: true },
      });
    }
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: run } } });
    await prisma.$disconnect();
  });

  /** Labels of this run's properties, in the order the API returns them. */
  async function labelsFor(sort?: string, extra = "") {
    const query = `search=${run}&pageSize=50${sort ? `&sort=${sort}` : ""}${extra}`;
    const { status, body } = await list(query);
    expect(status).toBe(200);
    return body.data.map((property) => property.title.replace(` ${run}`, ""));
  }

  it("orders by newest first by default", async () => {
    expect(await labelsFor()).toEqual(["f", "land-small", "land-big", "c", "b", "a"]);
    expect(await labelsFor("newest")).toEqual(await labelsFor());
  });

  it("orders by price ascending, keeping equal prices in a stable order", async () => {
    // Price 200 is shared by c and f: the newest (f) goes first.
    expect(await labelsFor("price-asc")).toEqual(["land-big", "land-small", "b", "f", "c", "a"]);
  });

  it("orders by price descending", async () => {
    expect(await labelsFor("price-desc")).toEqual(["a", "f", "c", "b", "land-small", "land-big"]);
  });

  it("orders by area ascending, with properties without usable area last by total area", async () => {
    // a(50) < c(80) = f(80, total 90 < 95) < b(120); then land-small(400) < land-big(5000).
    expect(await labelsFor("area-asc")).toEqual(["a", "c", "f", "b", "land-small", "land-big"]);
  });

  it("orders by area descending, still leaving properties without usable area last", async () => {
    expect(await labelsFor("area-desc")).toEqual(["b", "f", "c", "a", "land-big", "land-small"]);
  });

  it("is stable across pages: paging through each order returns every property exactly once", async () => {
    for (const sort of ["newest", "price-asc", "price-desc", "area-asc", "area-desc"]) {
      const everything = await labelsFor(sort);
      const paged: string[] = [];
      for (let page = 1; page <= 3; page += 1) {
        const { body } = await list(`search=${run}&pageSize=2&page=${page}&sort=${sort}`);
        paged.push(...body.data.map((property) => property.title.replace(` ${run}`, "")));
      }
      expect(paged, sort).toEqual(everything);
      expect(new Set(paged).size, sort).toBe(fixtures.length);
    }
  });

  it("combines with filters and counts only the filtered properties", async () => {
    expect(await labelsFor("price-asc", "&minPrice=100&maxPrice=200")).toEqual(["b", "f", "c"]);
    const { body } = await list(`search=${run}&sort=price-asc&minPrice=100&maxPrice=200&pageSize=1`);
    expect(body.meta).toMatchObject({ total: 3, totalPages: 3 });
  });

  it("keeps the order when the sort is empty or absent", async () => {
    const { body } = await list(`search=${run}&pageSize=50&sort=`);
    expect(body.data.map((property) => property.title.replace(` ${run}`, ""))).toEqual(await labelsFor());
  });

  it.each(["cheapest", "PRICE-ASC", "price_asc"])("rejects the unknown order %s with 400", async (sort) => {
    const { status } = await list(`sort=${sort}`);
    expect(status).toBe(400);
  });

  it("never exposes unpublished properties whatever the order", async () => {
    const prisma = await getPrisma();
    await prisma.property.create({
      data: {
        title: `draft ${run}`,
        description: "Sort test",
        address: "Calle 1",
        operationType: "SALE",
        propertyType: "HOUSE",
        price: "1",
        usableArea: "1",
        commune: "Sort Test",
        city: "Sort Test",
        region: "Sort Test",
        isPublished: false,
      },
    });
    for (const sort of ["price-asc", "area-asc"]) {
      expect(await labelsFor(sort)).not.toContain("draft");
    }
  });
});

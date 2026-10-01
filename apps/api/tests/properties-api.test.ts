import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PaginatedResponse, PropertyDetail, PropertySummary } from "@portal/shared/property";

// Integration test: calls the real Route Handlers against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const baseUrl = "http://localhost:3000/api/properties";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function listProperties(query = "") {
  const { GET } = await import("@/app/api/properties/route");
  const response = await GET(new NextRequest(`${baseUrl}${query}`));
  return { status: response.status, body: await response.json() };
}

async function getProperty(id: string) {
  const { GET } = await import("@/app/api/properties/[id]/route");
  const response = await GET(new NextRequest(`${baseUrl}/${id}`), { params: Promise.resolve({ id }) });
  return { status: response.status, body: await response.json() };
}

async function fetchAllPublishedIds(): Promise<string[]> {
  const { body } = await listProperties("?pageSize=50");
  const firstPage = body as PaginatedResponse<PropertySummary>;
  const ids = firstPage.data.map((property) => property.id);
  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const { body: nextPage } = await listProperties(`?pageSize=50&page=${page}`);
    ids.push(...(nextPage as PaginatedResponse<PropertySummary>).data.map((property) => property.id));
  }
  return ids;
}

describe.skipIf(!hasDatabaseUrl)("public properties API", () => {
  let publishedId: string;
  let draftId: string;
  let featuredRentId: string;

  beforeAll(async () => {
    const prisma = await getPrisma();
    const baseProperty = {
      description: "Integration test property",
      operationType: "SALE" as const,
      propertyType: "APARTMENT" as const,
      price: "215000.50",
      usableArea: "68",
      bedrooms: 2,
      bathrooms: 2,
      address: "Av. Nueva Providencia 1860",
      commune: "Providencia",
      city: "Santiago",
      region: "Región Metropolitana",
    };

    const published = await prisma.property.create({
      data: {
        ...baseProperty,
        title: `Published ${testRunId}`,
        isPublished: true,
        images: {
          create: [
            { url: "https://example.com/second.jpg", publicId: `test/${testRunId}-1`, position: 1, isMain: false },
            { url: "https://example.com/main.jpg", publicId: `test/${testRunId}-0`, position: 0, isMain: true },
          ],
        },
        features: {
          create: [
            { feature: { create: { name: `Terraza ${testRunId}` } } },
            { feature: { create: { name: `Ascensor ${testRunId}` } } },
          ],
        },
      },
    });
    const draft = await prisma.property.create({
      data: { ...baseProperty, title: `Draft ${testRunId}`, isPublished: false },
    });
    const featuredRent = await prisma.property.create({
      data: { ...baseProperty, title: `Featured rent ${testRunId}`, operationType: "RENT", price: "1450", isPublished: true, isFeatured: true },
    });
    publishedId = published.id;
    featuredRentId = featuredRent.id;
    draftId = draft.id;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.feature.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  describe("GET /api/properties", () => {
    it("lists published properties with summary fields and the main image", async () => {
      const { status, body } = await listProperties("?pageSize=50");

      expect(status).toBe(200);
      const property = (body as PaginatedResponse<PropertySummary>).data.find((item) => item.id === publishedId);
      expect(property).toMatchObject({
        title: `Published ${testRunId}`,
        price: 215000.5,
        currency: "USD",
        usableArea: 68,
        mainImageUrl: "https://example.com/main.jpg",
      });
      expect(property).not.toHaveProperty("isPublished");
    });

    it("never includes unpublished properties", async () => {
      const ids = await fetchAllPublishedIds();
      expect(ids).toContain(publishedId);
      expect(ids).not.toContain(draftId);
    });

    it("reports a total equal to the number of published properties in PostgreSQL", async () => {
      const prisma = await getPrisma();
      const { body } = await listProperties("?pageSize=1");
      const { meta, data } = body as PaginatedResponse<PropertySummary>;

      expect(meta.total).toBe(await prisma.property.count({ where: { isPublished: true } }));
      expect(meta.totalPages).toBe(meta.total);
      expect(data).toHaveLength(1);
    });

    it("orders by most recent first", async () => {
      const { body } = await listProperties("?pageSize=50");
      const dates = (body as PaginatedResponse<PropertySummary>).data.map((item) => item.createdAt);
      expect(dates).toEqual([...dates].sort().reverse());
    });

    it("filters by operation", async () => {
      const { status, body } = await listProperties("?operation=RENT&pageSize=50");
      const { data } = body as PaginatedResponse<PropertySummary>;

      expect(status).toBe(200);
      expect(data.map((item) => item.id)).toContain(featuredRentId);
      expect(data.map((item) => item.id)).not.toContain(publishedId);
      expect(data.every((item) => item.operationType === "RENT")).toBe(true);
    });

    it("filters featured properties and combines filters", async () => {
      const featured = (await listProperties("?featured=true&pageSize=50")).body as PaginatedResponse<PropertySummary>;
      expect(featured.data.map((item) => item.id)).toEqual([featuredRentId]);

      const featuredSale = (await listProperties("?featured=true&operation=SALE")).body as PaginatedResponse<PropertySummary>;
      expect(featuredSale.data).toEqual([]);
      expect(featuredSale.meta.total).toBe(0);
    });

    it("returns 400 for invalid filters", async () => {
      expect((await listProperties("?operation=BUY")).status).toBe(400);
      expect((await listProperties("?featured=maybe")).status).toBe(400);
    });

    it("returns 400 with the documented error body for invalid pagination", async () => {
      const { status, body } = await listProperties("?page=0");
      expect(status).toBe(400);
      expect(body).toEqual({ message: "Parámetros de consulta inválidos", status: 400 });
    });
  });

  describe("GET /api/properties/{id}", () => {
    it("returns the full detail with ordered images and features", async () => {
      const { status, body } = await getProperty(publishedId);
      const detail = body as PropertyDetail;

      expect(status).toBe(200);
      expect(detail).toMatchObject({
        id: publishedId,
        description: "Integration test property",
        address: "Av. Nueva Providencia 1860",
        price: 215000.5,
      });
      expect(detail.images.map((image) => image.position)).toEqual([0, 1]);
      expect(detail.images[0].isMain).toBe(true);
      expect(detail.features).toEqual([`Ascensor ${testRunId}`, `Terraza ${testRunId}`]);
    });

    it("returns 404 for unpublished properties", async () => {
      const { status, body } = await getProperty(draftId);
      expect(status).toBe(404);
      expect(body).toEqual({ message: "Propiedad no encontrada", status: 404 });
    });

    it("returns 404 for unknown ids", async () => {
      const { status } = await getProperty(randomUUID());
      expect(status).toBe(404);
    });

    it("returns 400 for malformed ids", async () => {
      const { status, body } = await getProperty("not-a-uuid");
      expect(status).toBe(400);
      expect(body).toEqual({ message: "Identificador de propiedad inválido", status: 400 });
    });
  });
});

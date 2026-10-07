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
  let searchTargetId: string;
  let accentedId: string;
  let unaccentedId: string;

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
    const searchTarget = await prisma.property.create({
      data: {
        ...baseProperty,
        title: `Casona Zzquux ${testRunId}`,
        description: `Antigua casa con jardín interior y estilo colonial ${testRunId}`,
        commune: `Peñalolén${testRunId}`,
        city: `Ciudad Vxyzw ${testRunId}`,
        region: `Región Qwerty ${testRunId}`,
        isPublished: true,
      },
    });
    await prisma.property.create({
      data: { ...baseProperty, title: `Draft Zzquux ${testRunId}`, isPublished: false },
    });
    // Stored WITH accents: "Ñandú" in the title, "Maipú" and "Ñuñoa" in the location.
    const accented = await prisma.property.create({
      data: {
        ...baseProperty,
        title: `Ñandú Quillón ${testRunId}`,
        description: "Casa con pingüinera",
        commune: `Maipú${testRunId}`,
        city: `Ñuñoa${testRunId}`,
        isPublished: true,
      },
    });
    // Stored WITHOUT accents (as an admin may type them): "Rapel" and "Penaflor".
    const unaccented = await prisma.property.create({
      data: {
        ...baseProperty,
        title: `Parcela Rapel ${testRunId}`,
        commune: `Penaflor${testRunId}`,
        isPublished: true,
      },
    });
    accentedId = accented.id;
    unaccentedId = unaccented.id;
    publishedId = published.id;
    searchTargetId = searchTarget.id;
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
        currency: "CLP",
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

    describe("search", () => {
      const searchIds = async (query: string) => {
        const { status, body } = await listProperties(`?pageSize=50&search=${encodeURIComponent(query)}`);
        expect(status).toBe(200);
        return (body as PaginatedResponse<PropertySummary>).data.map((item) => item.id);
      };

      it.each([
        ["title", "Zzquux"],
        ["description", "colonial"],
        ["commune", "Peñalolén"],
        ["city", "Vxyzw"],
        ["region", "Qwerty"],
      ])("matches the %s", async (_field, term) => {
        expect(await searchIds(`${term} ${testRunId}`)).toEqual([searchTargetId]);
      });

      describe("accents", () => {
        it.each([
          ["maipu", "text without accents finds an accented commune"],
          ["Maipú", "accented text finds the same accented commune"],
          ["MAIPÚ", "uppercase accented text"],
          ["MAIPU", "uppercase text without accents"],
          ["maipú", "lowercase accented text"],
        ])("finds the property stored as Maipú when searching %s (%s)", async (query) => {
          expect(await searchIds(`${query}${testRunId}`)).toEqual([accentedId]);
        });

        it.each(["nunoa", "Ñuñoa", "ÑUÑOA", "NUNOA", "ñunoa", "nuñoa"])("finds Ñuñoa when searching %s", async (query) => {
          expect(await searchIds(`${query}${testRunId}`)).toEqual([accentedId]);
        });

        it("finds accented text in the title and the description", async () => {
          expect(await searchIds(`nandu quillon ${testRunId}`)).toEqual([accentedId]);
          expect(await searchIds(`ÑANDÚ QUILLÓN ${testRunId}`)).toEqual([accentedId]);
          expect(await searchIds(`pinguinera ${testRunId}`)).toEqual([accentedId]);
          expect(await searchIds(`pingüinera ${testRunId}`)).toEqual([accentedId]);
        });

        it("finds text stored without accents when the search has accents", async () => {
          expect(await searchIds(`Peñaflor${testRunId}`)).toEqual([unaccentedId]);
          expect(await searchIds(`penaflor${testRunId}`)).toEqual([unaccentedId]);
          expect(await searchIds(`Rápel ${testRunId}`)).toEqual([unaccentedId]);
        });

        it("accepts decomposed Unicode (letter plus separate accent)", async () => {
          expect(await searchIds(`Maipu\u0301${testRunId}`)).toEqual([accentedId]);
          expect(await searchIds(`N\u0303un\u0303oa${testRunId}`)).toEqual([accentedId]);
        });

        it("matches several words with mixed accents", async () => {
          expect(await searchIds(`Maipú nunoa ñandú ${testRunId}`)).toEqual([accentedId]);
        });

        it("does not treat different letters as equal", async () => {
          expect(await searchIds(`mainu${testRunId}`)).toEqual([]);
          expect(await searchIds(`maipo${testRunId}`)).toEqual([]);
        });

        it("keeps the search column up to date when a property is edited", async () => {
          const prisma = await getPrisma();
          await prisma.property.update({
            where: { id: unaccentedId },
            data: { commune: `Ñiquén${testRunId}` },
          });

          expect(await searchIds(`niquen${testRunId}`)).toEqual([unaccentedId]);
          expect(await searchIds(`Ñiquén${testRunId}`)).toEqual([unaccentedId]);
          expect(await searchIds(`penaflor${testRunId}`)).toEqual([]);
        });

        it("never exposes the search column in the API responses", async () => {
          const { body } = await listProperties(`?search=${encodeURIComponent(`maipu${testRunId}`)}`);
          expect(JSON.stringify(body)).not.toContain("searchText");
          const detail = await getProperty(accentedId);
          expect(JSON.stringify(detail.body)).not.toContain("searchText");
        });
      });

      it("ignores case", async () => {
        expect(await searchIds(`ZZQUUX ${testRunId}`)).toEqual([searchTargetId]);
        expect(await searchIds(`zzquux ${testRunId}`)).toEqual([searchTargetId]);
      });

      it("requires every word, each one in any field", async () => {
        expect(await searchIds(`zzquux colonial vxyzw ${testRunId}`)).toEqual([searchTargetId]);
        expect(await searchIds(`zzquux inexistente ${testRunId}`)).toEqual([]);
      });

      it("matches partial words", async () => {
        expect(await searchIds(`zzqu ${testRunId}`)).toEqual([searchTargetId]);
      });

      it("never returns unpublished properties", async () => {
        expect(await searchIds(`draft ${testRunId}`)).toEqual([]);
        expect(await searchIds(`Draft Zzquux ${testRunId}`)).toEqual([]);
      });

      it("treats % and _ as plain characters instead of wildcards", async () => {
        expect(await searchIds("%")).toEqual([]);
        expect(await searchIds("_")).toEqual([]);
        expect(await searchIds(`zzq_ux ${testRunId}`)).toEqual([]);
      });

      it("treats quotes and SQL-looking text as plain text", async () => {
        expect(await searchIds("'; DROP TABLE \"Property\"; --")).toEqual([]);
        const { body } = await listProperties("?pageSize=1");
        expect((body as PaginatedResponse<PropertySummary>).meta.total).toBeGreaterThan(0);
      });

      it("counts and paginates only the matches", async () => {
        const { body } = await listProperties(`?pageSize=1&search=${encodeURIComponent(`zzquux ${testRunId}`)}`);
        expect((body as PaginatedResponse<PropertySummary>).meta).toEqual({
          page: 1,
          pageSize: 1,
          total: 1,
          totalPages: 1,
        });
      });

      it("combines with the other filters", async () => {
        const text = encodeURIComponent(`zzquux ${testRunId}`);
        const rent = await listProperties(`?operation=RENT&search=${text}`);
        expect((rent.body as PaginatedResponse<PropertySummary>).data).toEqual([]);
        const sale = await listProperties(`?operation=SALE&search=${text}`);
        expect((sale.body as PaginatedResponse<PropertySummary>).data).toHaveLength(1);
      });

      it("ignores an empty search and rejects an excessively long one", async () => {
        const all = await listProperties("?pageSize=1");
        const empty = await listProperties("?pageSize=1&search=%20%20");
        expect((empty.body as PaginatedResponse<PropertySummary>).meta.total).toBe(
          (all.body as PaginatedResponse<PropertySummary>).meta.total,
        );
        expect((await listProperties(`?search=${"a".repeat(101)}`)).status).toBe(400);
      });
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

import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import type { PaginatedResponse, PropertyFilterOptions, PropertySummary } from "@portal/shared/property";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

// Integration test: catalog filters through the real Route Handlers against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const run = randomUUID().slice(0, 8);
const name = (base: string) => `${base} ${run}`;
const slug = (base: string) => `${base}-${run}`;

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function listProperties(query: string) {
  const { GET } = await import("@/app/api/properties/route");
  // 50 per page unless the query sets its own page size.
  const pageSize = query.includes("pageSize=") ? "" : "pageSize=50&";
  const response = await GET(new NextRequest(`http://localhost:3000/api/properties?${pageSize}${query}`));
  return { status: response.status, body: await response.json() };
}

type Fixture = Omit<Prisma.PropertyCreateInput, "description" | "address" | "isPublished">;

// Each fixture has a distinct profile so every filter has an exact expected result.
const fixtures = {
  houseNunoa: {
    title: "Casa Ñuñoa",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: "300000",
    bedrooms: 4,
    bathrooms: 3,
    usableArea: "200",
    commune: name("Ñuñoa"),
    city: name("Santiago"),
    region: name("Región Metropolitana"),
  },
  houseNunoaPlain: {
    title: "Casa Nunoa",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: "250000",
    bedrooms: 3,
    bathrooms: 2,
    usableArea: "150",
    commune: name("NUNOA"),
    city: name("Santiago"),
    region: name("Región Metropolitana"),
  },
  apartmentSale: {
    title: "Depto venta",
    operationType: "SALE",
    propertyType: "APARTMENT",
    price: "150000",
    bedrooms: 2,
    bathrooms: 1,
    usableArea: "70",
    commune: name("Las Condes"),
    city: name("Santiago"),
    region: name("Región Metropolitana"),
  },
  apartmentRent: {
    title: "Depto arriendo",
    operationType: "RENT",
    propertyType: "APARTMENT",
    price: "1200",
    bedrooms: 3,
    bathrooms: 2,
    usableArea: "95",
    commune: name("Las Condes"),
    city: name("Santiago"),
    region: name("Región Metropolitana"),
  },
  land: {
    title: "Terreno",
    operationType: "SALE",
    propertyType: "LAND",
    price: "90000",
    totalArea: "5000",
    commune: name("Colina"),
    city: name("Colina"),
    region: name("Región Metropolitana"),
  },
  office: {
    title: "Oficina",
    operationType: "RENT",
    propertyType: "OFFICE",
    price: "2500",
    bathrooms: 2,
    usableArea: "180",
    commune: name("Viña del Mar"),
    city: name("Viña del Mar"),
    region: name("Región de Valparaíso"),
  },
} satisfies Record<string, Fixture>;
type FixtureKey = keyof typeof fixtures;

const ids = {} as Record<FixtureKey, string>;
let draftId: string;

describe.skipIf(!hasDatabaseUrl)("catalog filters", () => {
  beforeAll(async () => {
    const prisma = await getPrisma();
    for (const [key, fixture] of Object.entries(fixtures) as [FixtureKey, Fixture][]) {
      const property = await prisma.property.create({
        data: { ...fixture, title: name(fixture.title), description: "Filter test", address: "Calle 123", isPublished: true },
      });
      ids[key] = property.id;
    }
    // A draft that matches every filter used below, with a city only it has.
    const draft = await prisma.property.create({
      data: {
        title: name("Borrador"),
        description: "Filter test",
        operationType: "SALE",
        propertyType: "APARTMENT",
        price: "150000",
        bedrooms: 5,
        bathrooms: 5,
        usableArea: "500",
        address: "Calle 123",
        commune: name("Las Condes"),
        city: name("Draftville"),
        region: name("Región Metropolitana"),
        isPublished: false,
      },
    });
    draftId = draft.id;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { title: { contains: run } } });
    await prisma.$disconnect();
  });

  /** Fixtures returned by the query (other data in the database is ignored). */
  async function fixturesFor(query: string): Promise<FixtureKey[]> {
    const { status, body } = await listProperties(query);
    expect(status).toBe(200);
    const returnedIds = new Set((body as PaginatedResponse<PropertySummary>).data.map((item) => item.id));
    expect(returnedIds.has(draftId)).toBe(false);
    return (Object.keys(ids) as FixtureKey[]).filter((key) => returnedIds.has(ids[key])).sort();
  }

  const inRegion = `region=${slug("region-metropolitana")}`;
  // Restrict every query to this run's fixtures through the text search.
  const ofThisRun = (query: string) => `${query}&search=${run}`;

  it.each<[string, string, FixtureKey[]]>([
    ["sale", "operation=SALE", ["apartmentSale", "houseNunoa", "houseNunoaPlain", "land"]],
    ["rent", "operation=RENT", ["apartmentRent", "office"]],
    ["property type", "type=APARTMENT", ["apartmentRent", "apartmentSale"]],
    ["minimum price", "minPrice=150000", ["apartmentSale", "houseNunoa", "houseNunoaPlain"]],
    ["maximum price", "maxPrice=2500", ["apartmentRent", "office"]],
    ["price range", "minPrice=2000&maxPrice=150000", ["apartmentSale", "land", "office"]],
    ["minimum bedrooms, excluding properties without bedrooms", "bedrooms=3", ["apartmentRent", "houseNunoa", "houseNunoaPlain"]],
    ["minimum bathrooms", "bathrooms=2", ["apartmentRent", "houseNunoa", "houseNunoaPlain", "office"]],
    ["minimum usable area, excluding land without it", "minUsableArea=150", ["houseNunoa", "houseNunoaPlain", "office"]],
    ["commune slug", `commune=${slug("las-condes")}`, ["apartmentRent", "apartmentSale"]],
    ["commune slug matching accented and plain spellings", `commune=${slug("nunoa")}`, ["houseNunoa", "houseNunoaPlain"]],
    ["city slug", `city=${slug("vina-del-mar")}`, ["office"]],
    ["region slug", inRegion, ["apartmentRent", "apartmentSale", "houseNunoa", "houseNunoaPlain", "land"]],
    ["uppercase slug", `commune=${slug("LAS-CONDES")}`, ["apartmentRent", "apartmentSale"]],
  ])("filters by %s", async (_label, query, expected) => {
    expect(await fixturesFor(ofThisRun(query))).toEqual([...expected].sort());
  });

  it.each<[string, string, FixtureKey[]]>([
    [
      "several communes (any of them)",
      `commune=${slug("las-condes")}&commune=${slug("colina")}`,
      ["apartmentRent", "apartmentSale", "land"],
    ],
    ["several cities", `city=${slug("vina-del-mar")}&city=${slug("colina")}`, ["land", "office"]],
    [
      "several regions",
      `region=${slug("region-metropolitana")}&region=${slug("region-de-valparaiso")}`,
      ["apartmentRent", "apartmentSale", "houseNunoa", "houseNunoaPlain", "land", "office"],
    ],
    [
      "several communes combined with another filter",
      `commune=${slug("las-condes")}&commune=${slug("colina")}&operation=SALE`,
      ["apartmentSale", "land"],
    ],
    [
      "a known and an unknown commune",
      `commune=${slug("colina")}&commune=${slug("atlantida")}`,
      ["land"],
    ],
  ])("filters by %s", async (_label, query, expected) => {
    expect(await fixturesFor(ofThisRun(query))).toEqual([...expected].sort());
  });

  it("rejects a repeated single-value parameter instead of guessing which one to use", async () => {
    const { status } = await listProperties("type=HOUSE&type=APARTMENT");
    expect(status).toBe(400);
  });

  it("combines every filter with AND", async () => {
    const query = [
      "operation=SALE",
      "type=APARTMENT",
      "minPrice=100000",
      "maxPrice=200000",
      "bedrooms=2",
      "bathrooms=1",
      "minUsableArea=60",
      `commune=${slug("las-condes")}`,
      `city=${slug("santiago")}`,
      inRegion,
    ].join("&");
    expect(await fixturesFor(ofThisRun(query))).toEqual(["apartmentSale"]);
  });

  it("combines filters with the text search", async () => {
    expect(await fixturesFor(`operation=SALE&search=${encodeURIComponent(`casa ${run}`)}`)).toEqual([
      "houseNunoa",
      "houseNunoaPlain",
    ]);
  });

  it("returns nothing for an unknown location instead of ignoring the filter", async () => {
    const { body } = await listProperties(`commune=${slug("atlantida")}`);
    expect((body as PaginatedResponse<PropertySummary>).meta.total).toBe(0);
  });

  it("counts only the filtered properties", async () => {
    const { body } = await listProperties(ofThisRun("type=APARTMENT&pageSize=1"));
    expect((body as PaginatedResponse<PropertySummary>).meta).toMatchObject({ total: 2, totalPages: 2 });
  });

  it("ignores empty filter values", async () => {
    expect(await fixturesFor(ofThisRun("type=&minPrice=&commune=&bedrooms="))).toHaveLength(
      Object.keys(fixtures).length,
    );
  });

  it("explains a minimum price greater than the maximum", async () => {
    const { status, body } = await listProperties("minPrice=300000&maxPrice=1000");
    expect(status).toBe(400);
    expect(body).toEqual({ message: "El precio mínimo no puede ser mayor que el máximo", status: 400 });
  });

  it.each(["type=CASTLE", "minPrice=-1", "bedrooms=abc", "commune=las%20condes", "region=%C3%B1u%C3%B1oa"])(
    "rejects the invalid filter %s with 400",
    async (query) => {
      const { status, body } = await listProperties(query);
      expect(status).toBe(400);
      expect(body).toEqual({ message: "Parámetros de consulta inválidos", status: 400 });
    },
  );

  describe("GET /api/properties/filter-options", () => {
    async function getOptions(): Promise<PropertyFilterOptions> {
      const { GET } = await import("@/app/api/properties/filter-options/route");
      const response = await GET();
      expect(response.status).toBe(200);
      return response.json();
    }

    it("lists the locations of published properties with their slugs", async () => {
      const options = await getOptions();

      expect(options.communes).toEqual(
        expect.arrayContaining([
          { slug: slug("las-condes"), name: name("Las Condes") },
          { slug: slug("colina"), name: name("Colina") },
        ]),
      );
      expect(options.cities).toEqual(expect.arrayContaining([{ slug: slug("vina-del-mar"), name: name("Viña del Mar") }]));
      expect(options.regions).toEqual(
        expect.arrayContaining([
          { slug: slug("region-metropolitana"), name: name("Región Metropolitana") },
          { slug: slug("region-de-valparaiso"), name: name("Región de Valparaíso") },
        ]),
      );
    });

    it("shows spellings sharing a slug once, with accents", async () => {
      const nunoa = (await getOptions()).communes.filter((option) => option.slug === slug("nunoa"));
      expect(nunoa).toEqual([{ slug: slug("nunoa"), name: name("Ñuñoa") }]);
    });

    it("never offers a location that only unpublished properties have", async () => {
      const cities = (await getOptions()).cities.map((option) => option.slug);
      expect(cities).not.toContain(slug("draftville"));
    });

    it("returns each list sorted alphabetically", async () => {
      const options = await getOptions();
      for (const list of [options.regions, options.cities, options.communes]) {
        const names = list.map((option) => option.name);
        expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second, "es")));
      }
    });
  });
});

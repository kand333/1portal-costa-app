import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/api-error";
import * as propertyRepository from "@/repositories/property-repository";
import { getPublishedPropertyDetail, listPublishedProperties, splitSearchTerms } from "./property-service";

vi.mock("@/repositories/property-repository", () => ({
  findPublishedProperties: vi.fn(),
  findPublishedPropertyById: vi.fn(),
}));

const decimal = (value: number) => ({ toNumber: () => value });
const createdAt = new Date("2026-09-01T10:00:00.000Z");
const updatedAt = new Date("2026-09-02T10:00:00.000Z");

const summaryRecord = {
  id: "5eed0000-0000-4000-8000-000000000001",
  title: "Casa",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: decimal(890000.5),
  currency: "CLP",
  usableArea: decimal(320),
  totalArea: null,
  bedrooms: 5,
  bathrooms: 4,
  commune: "Lo Barnechea",
  city: "Santiago",
  region: "Región Metropolitana",
  isFeatured: true,
  createdAt,
  images: [{ url: "https://example.com/main.jpg" }],
};

const detailRecord = {
  ...summaryRecord,
  description: "Descripción",
  parkingSpaces: 3,
  ageInYears: 8,
  address: "Camino Los Trapenses 4200",
  updatedAt,
  images: [{ id: "image-1", url: "https://example.com/main.jpg", position: 0, isMain: true }],
  features: [{ feature: { name: "Jardín" } }, { feature: { name: "Piscina" } }],
};

describe("listPublishedProperties", () => {
  beforeEach(() => vi.clearAllMocks());

  it("translates the page into skip/take and builds the pagination meta", async () => {
    vi.mocked(propertyRepository.findPublishedProperties).mockResolvedValue({ records: [], total: 25 });

    const result = await listPublishedProperties({ page: 3, pageSize: 10 });

    expect(propertyRepository.findPublishedProperties).toHaveBeenCalledWith(
      { operationType: undefined, isFeatured: undefined, searchTerms: [] },
      { skip: 20, take: 10 },
      undefined,
    );
    expect(result.meta).toEqual({ page: 3, pageSize: 10, total: 25, totalPages: 3 });
  });

  it("maps records to plain JSON-safe summaries", async () => {
    vi.mocked(propertyRepository.findPublishedProperties).mockResolvedValue({
      records: [summaryRecord, { ...summaryRecord, id: "other", images: [] }] as never,
      total: 2,
    });

    const { data } = await listPublishedProperties({ page: 1, pageSize: 12 });

    expect(data[0]).toEqual({
      id: summaryRecord.id,
      title: "Casa",
      operationType: "SALE",
      propertyType: "HOUSE",
      price: 890000.5,
      currency: "CLP",
      usableArea: 320,
      totalArea: null,
      bedrooms: 5,
      bathrooms: 4,
      commune: "Lo Barnechea",
      city: "Santiago",
      region: "Región Metropolitana",
      isFeatured: true,
      mainImageUrl: "https://example.com/main.jpg",
      createdAt: "2026-09-01T10:00:00.000Z",
    });
    expect(data[1].mainImageUrl).toBeNull();
  });

  it("passes the operation and featured filters to the repository", async () => {
    vi.mocked(propertyRepository.findPublishedProperties).mockResolvedValue({ records: [], total: 0 });

    await listPublishedProperties({ page: 1, pageSize: 6, operation: "RENT", featured: true });

    expect(propertyRepository.findPublishedProperties).toHaveBeenCalledWith(
      { operationType: "RENT", isFeatured: true, searchTerms: [] },
      { skip: 0, take: 6 },
      undefined,
    );
  });

  it("passes the search words to the repository", async () => {
    vi.mocked(propertyRepository.findPublishedProperties).mockResolvedValue({ records: [], total: 0 });

    await listPublishedProperties({ page: 1, pageSize: 12, search: "Casa  Providencia" });

    expect(propertyRepository.findPublishedProperties).toHaveBeenCalledWith(
      expect.objectContaining({ searchTerms: ["casa", "providencia"] }),
      { skip: 0, take: 12 },
      undefined,
    );
  });

  it("passes the requested sort order to the repository", async () => {
    vi.mocked(propertyRepository.findPublishedProperties).mockResolvedValue({ records: [], total: 0 });

    await listPublishedProperties({ page: 2, pageSize: 6, sort: "price-desc" });

    expect(propertyRepository.findPublishedProperties).toHaveBeenCalledWith(
      expect.any(Object),
      { skip: 6, take: 6 },
      "price-desc",
    );
  });

  it("reports zero pages when there are no results", async () => {
    vi.mocked(propertyRepository.findPublishedProperties).mockResolvedValue({ records: [], total: 0 });
    const { meta } = await listPublishedProperties({ page: 1, pageSize: 12 });
    expect(meta.totalPages).toBe(0);
  });
});

describe("getPublishedPropertyDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps the detail with feature names and images", async () => {
    vi.mocked(propertyRepository.findPublishedPropertyById).mockResolvedValue(detailRecord as never);

    const detail = await getPublishedPropertyDetail(detailRecord.id);

    expect(detail.features).toEqual(["Jardín", "Piscina"]);
    expect(detail.images).toEqual(detailRecord.images);
    expect(detail.price).toBe(890000.5);
    expect(detail.updatedAt).toBe("2026-09-02T10:00:00.000Z");
    expect(detail).not.toHaveProperty("mainImageUrl");
  });

  it("throws a 404 ApiError when the property is missing or unpublished", async () => {
    vi.mocked(propertyRepository.findPublishedPropertyById).mockResolvedValue(null);

    const error = await getPublishedPropertyDetail("missing").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: "Propiedad no encontrada" });
  });
});

describe("splitSearchTerms", () => {
  it("returns no terms for an empty search", () => {
    expect(splitSearchTerms(undefined)).toEqual([]);
    expect(splitSearchTerms("")).toEqual([]);
    expect(splitSearchTerms("   ")).toEqual([]);
  });

  it("removes accents so the words match the normalized search column", () => {
    expect(splitSearchTerms("Maipú Ñuñoa")).toEqual(["maipu", "nunoa"]);
    expect(splitSearchTerms("CONCÓN")).toEqual(["concon"]);
  });

  it("treats words that only differ in accents or case as repeated", () => {
    expect(splitSearchTerms("Maipú maipu MAIPÚ")).toEqual(["maipu"]);
  });

  it("splits on any whitespace and lowercases", () => {
    expect(splitSearchTerms("  Casa 	 Las   Condes ")).toEqual(["casa", "las", "condes"]);
  });

  it("removes repeated words", () => {
    expect(splitSearchTerms("casa CASA casa")).toEqual(["casa"]);
  });

  it("ignores words beyond the limit", () => {
    expect(splitSearchTerms("a b c d e f g")).toEqual(["a", "b", "c", "d", "e"]);
  });
});

import { describe, expect, it } from "vitest";
import { seedFeatureNames, seedProperties } from "../prisma/seed/data";

const publishedProperties = seedProperties.filter((property) => property.isPublished);
const countBy = <Key extends string>(keys: Key[]) =>
  keys.reduce<Partial<Record<Key, number>>>((counts, key) => ({ ...counts, [key]: (counts[key] ?? 0) + 1 }), {});

describe("seed data", () => {
  it("uses unique identifiers and titles", () => {
    expect(new Set(seedProperties.map((property) => property.id)).size).toBe(seedProperties.length);
    expect(new Set(seedProperties.map((property) => property.title)).size).toBe(seedProperties.length);
  });

  it("includes published properties for sale and for rent", () => {
    const operations = countBy(publishedProperties.map((property) => property.operationType));
    expect(operations.SALE).toBeGreaterThanOrEqual(5);
    expect(operations.RENT).toBeGreaterThanOrEqual(5);
  });

  it("includes houses, apartments, land and offices", () => {
    const types = countBy(publishedProperties.map((property) => property.propertyType));
    for (const propertyType of ["HOUSE", "APARTMENT", "LAND", "OFFICE"] as const) {
      expect(types[propertyType], propertyType).toBeGreaterThanOrEqual(2);
    }
  });

  it("covers several communes and regions with different prices", () => {
    expect(new Set(seedProperties.map((property) => property.commune)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(seedProperties.map((property) => property.region)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(seedProperties.map((property) => property.price)).size).toBe(seedProperties.length);
  });

  it("has valid positive prices and complete locations", () => {
    for (const property of seedProperties) {
      expect(Number(property.price), property.title).toBeGreaterThan(0);
      for (const field of [property.address, property.commune, property.city, property.region]) {
        expect(field.trim(), property.title).not.toBe("");
      }
    }
  });

  it("does not assign bedrooms to land", () => {
    for (const property of seedProperties.filter((item) => item.propertyType === "LAND")) {
      expect(property.bedrooms, property.title).toBeUndefined();
      expect(property.totalArea, property.title).toBeDefined();
    }
  });

  it("only references known features, without repeating them", () => {
    const knownFeatureNames = new Set<string>(seedFeatureNames);
    for (const property of seedProperties) {
      expect(new Set(property.featureNames).size, property.title).toBe(property.featureNames.length);
      for (const featureName of property.featureNames) {
        expect(knownFeatureNames.has(featureName), `${property.title}: ${featureName}`).toBe(true);
      }
    }
  });

  it("uses every feature at least once and varies features between properties", () => {
    const usedFeatureNames = new Set(seedProperties.flatMap((property) => property.featureNames));
    expect(usedFeatureNames.size).toBe(seedFeatureNames.length);
  });

  it("includes featured properties and an unpublished draft", () => {
    expect(publishedProperties.filter((property) => property.isFeatured).length).toBeGreaterThanOrEqual(4);
    expect(seedProperties.some((property) => !property.isPublished)).toBe(true);
    expect(seedProperties.some((property) => !property.isPublished && property.isFeatured)).toBe(false);
  });
});

import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";
import { seedFeatureNames, seedProperties } from "../prisma/seed/data";
import { getSeedImages } from "../prisma/seed/images";
import { seedDatabase } from "../prisma/seed/seed-database";

// Integration test: runs the development seed against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const seedPropertyIds = seedProperties.map((property) => property.id);
const seedFeatureNameList = [...seedFeatureNames];
const expectedImageCount = seedProperties.reduce((total, property) => total + getSeedImages(property).length, 0);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function countSeedRows() {
  const prisma = await getPrisma();
  return {
    properties: await prisma.property.count({ where: { id: { in: seedPropertyIds } } }),
    features: await prisma.feature.count({ where: { name: { in: seedFeatureNameList } } }),
    featureLinks: await prisma.propertyFeature.count({ where: { propertyId: { in: seedPropertyIds } } }),
    images: await prisma.propertyImage.count({ where: { propertyId: { in: seedPropertyIds } } }),
    mainImages: await prisma.propertyImage.count({ where: { propertyId: { in: seedPropertyIds }, isMain: true } }),
  };
}

describe.skipIf(!hasDatabaseUrl)("seedDatabase", () => {
  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.property.deleteMany({ where: { id: { in: seedPropertyIds } } });
    await prisma.feature.deleteMany({ where: { name: { in: seedFeatureNameList } } });
    await prisma.$disconnect();
  });

  it("inserts every feature and property with its feature links", async () => {
    const prisma = await getPrisma();
    const summary = await seedDatabase(prisma);

    expect(summary).toEqual({
      featureCount: seedFeatureNames.length,
      propertyCount: seedProperties.length,
      imageCount: expectedImageCount,
    });
    expect(await countSeedRows()).toEqual({
      properties: seedProperties.length,
      features: seedFeatureNames.length,
      featureLinks: seedProperties.reduce((total, property) => total + property.featureNames.length, 0),
      images: expectedImageCount,
      mainImages: seedProperties.filter((property) => getSeedImages(property).length > 0).length,
    });
  });

  it("stores the data exactly as defined", async () => {
    const prisma = await getPrisma();
    const [expected] = seedProperties;
    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: expected.id },
      include: { features: { include: { feature: true } } },
    });

    expect(stored.title).toBe(expected.title);
    expect(stored.price.toString()).toBe(expected.price);
    expect(stored.currency).toBe("USD");
    expect(stored.createdAt.toISOString()).toBe(expected.createdAt);
    expect(stored.features.map((link) => link.feature.name).sort()).toEqual([...expected.featureNames].sort());

    const land = await prisma.property.findFirstOrThrow({
      where: { id: { in: seedPropertyIds }, propertyType: "LAND" },
    });
    expect(land.bedrooms).toBeNull();
    expect(land.usableArea).toBeNull();
  });

  it("can be re-run without duplicating rows and restores modified seed data", async () => {
    const prisma = await getPrisma();
    const [first] = seedProperties;
    const countsBefore = await countSeedRows();
    await prisma.property.update({ where: { id: first.id }, data: { title: "Modified", features: { deleteMany: {} } } });

    await seedDatabase(prisma);

    expect(await countSeedRows()).toEqual(countsBefore);
    const restored = await prisma.property.findUniqueOrThrow({ where: { id: first.id } });
    expect(restored.title).toBe(first.title);
  });

  it("keeps images uploaded by ADMIN and does not add placeholders next to them", async () => {
    const prisma = await getPrisma();
    const [first] = seedProperties;
    await prisma.propertyImage.deleteMany({ where: { propertyId: first.id } });
    await prisma.propertyImage.create({
      data: { propertyId: first.id, url: "https://res.cloudinary.com/x/upload.jpg", publicId: "portal/uploaded-test", position: 0, isMain: true },
    });

    const summary = await seedDatabase(prisma);

    const images = await prisma.propertyImage.findMany({ where: { propertyId: first.id } });
    expect(images.map((image) => image.publicId)).toEqual(["portal/uploaded-test"]);
    expect(summary.imageCount).toBe(expectedImageCount - getSeedImages(first).length);
  });
});

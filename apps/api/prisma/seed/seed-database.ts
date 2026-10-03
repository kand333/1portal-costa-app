import type { PrismaClient } from "../../src/generated/prisma/client";
import { seedFeatureNames, seedProperties } from "./data";
import { getSeedImages, SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } from "./images";

export type SeedSummary = {
  featureCount: number;
  propertyCount: number;
  imageCount: number;
};

/**
 * Inserts the development data. Safe to re-run: features are matched by name
 * and properties by their fixed id, so nothing is duplicated and rows created
 * outside the seed are left untouched. Placeholder images are only (re)created
 * for seed properties that have no real (uploaded) images.
 */
export async function seedDatabase(prisma: PrismaClient): Promise<SeedSummary> {
  const featureIdByName = new Map<string, string>();
  for (const name of seedFeatureNames) {
    const feature = await prisma.feature.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    featureIdByName.set(name, feature.id);
  }

  let imageCount = 0;
  for (const seedProperty of seedProperties) {
    const { id, featureNames, createdAt, ...fields } = seedProperty;
    const data = {
      ...fields,
      // Explicit nulls so a re-run also clears fields removed from the seed data.
      usableArea: fields.usableArea ?? null,
      totalArea: fields.totalArea ?? null,
      bedrooms: fields.bedrooms ?? null,
      bathrooms: fields.bathrooms ?? null,
      parkingSpaces: fields.parkingSpaces ?? null,
      ageInYears: fields.ageInYears ?? null,
      createdAt: new Date(createdAt),
    };
    const featureLinks = featureNames.map((featureName) => {
      const featureId = featureIdByName.get(featureName);
      if (!featureId) {
        throw new Error(`Seed property "${seedProperty.title}" uses unknown feature "${featureName}"`);
      }
      return { featureId };
    });

    const placeholderImages = getSeedImages(seedProperty);
    const isPlaceholder = { publicId: { startsWith: SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } };
    const uploadedImageCount = await prisma.propertyImage.count({
      where: { propertyId: id, NOT: isPlaceholder },
    });
    // Never mix placeholders with images uploaded by ADMIN (single main image rule).
    const images =
      uploadedImageCount > 0
        ? undefined
        : { deleteMany: isPlaceholder, create: placeholderImages };
    if (images) imageCount += placeholderImages.length;

    await prisma.property.upsert({
      where: { id },
      create: { id, ...data, features: { create: featureLinks }, images: { create: placeholderImages } },
      // Re-seeding also restores a seed property that ADMIN soft-deleted.
      update: { ...data, deletedAt: null, features: { deleteMany: {}, create: featureLinks }, images },
    });
  }

  return { featureCount: seedFeatureNames.length, propertyCount: seedProperties.length, imageCount };
}

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import type { SeedSnapshot } from "./snapshot";

/**
 * Writes `prisma/seed/snapshot.json` from a database, for the development seed.
 * Run from apps/api:  npx tsx prisma/seed/export-snapshot.ts
 * Source: SNAPSHOT_DATABASE_URL when set (e.g. the local Docker database), otherwise DATABASE_URL.
 * Exports no password hashes, sessions or presence data (lastSeenAt, loggedOutAt).
 */
const iso = (date: Date | null) => (date ? date.toISOString() : null);
const byId = <Row extends { id: string }>(rows: Row[]) => [...rows].sort((first, second) => first.id.localeCompare(second.id));

async function main() {
  loadEnvConfig(process.cwd());
  const connectionString = process.env.SNAPSHOT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Set SNAPSHOT_DATABASE_URL or DATABASE_URL");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const [features, users, properties, images, favorites, inquiries, messages] = await Promise.all([
      prisma.feature.findMany(),
      prisma.user.findMany(),
      prisma.property.findMany({ include: { features: { select: { featureId: true } } } }),
      prisma.propertyImage.findMany(),
      prisma.favorite.findMany(),
      prisma.inquiry.findMany(),
      prisma.inquiryMessage.findMany(),
    ]);

    const snapshot: SeedSnapshot = {
      exportedAt: new Date().toISOString(),
      features: byId(features).map(({ id, name, createdAt }) => ({ id, name, createdAt: createdAt.toISOString() })),
      users: byId(users).map(({ id, email, name, role, isActive, createdAt }) => ({
        id,
        email,
        name,
        role,
        isActive,
        createdAt: createdAt.toISOString(),
      })),
      properties: byId(properties).map((property) => ({
        id: property.id,
        title: property.title,
        description: property.description,
        operationType: property.operationType,
        propertyType: property.propertyType,
        price: property.price.toString(),
        currency: property.currency,
        usableArea: property.usableArea?.toString() ?? null,
        totalArea: property.totalArea?.toString() ?? null,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        ageInYears: property.ageInYears,
        address: property.address,
        commune: property.commune,
        city: property.city,
        region: property.region,
        isPublished: property.isPublished,
        isFeatured: property.isFeatured,
        deletedAt: iso(property.deletedAt),
        createdAt: property.createdAt.toISOString(),
        featureIds: property.features.map((link) => link.featureId).sort(),
      })),
      images: byId(images).map((image) => ({ ...image, createdAt: image.createdAt.toISOString() })),
      favorites: [...favorites]
        .sort((first, second) => `${first.userId}${first.propertyId}`.localeCompare(`${second.userId}${second.propertyId}`))
        .map((favorite) => ({ ...favorite, createdAt: favorite.createdAt.toISOString() })),
      inquiries: byId(inquiries).map((inquiry) => ({
        ...inquiry,
        createdAt: inquiry.createdAt.toISOString(),
        lastActivityAt: inquiry.lastActivityAt.toISOString(),
      })),
      messages: byId(messages).map((message) => ({ ...message, createdAt: message.createdAt.toISOString() })),
    };

    const path = join(process.cwd(), "prisma", "seed", "snapshot.json");
    writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(
      `Snapshot written: ${snapshot.features.length} features, ${snapshot.users.length} users, ${snapshot.properties.length} properties, ` +
        `${snapshot.images.length} images, ${snapshot.favorites.length} favorites, ${snapshot.inquiries.length} inquiries, ${snapshot.messages.length} messages.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

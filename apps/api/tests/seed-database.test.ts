import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";
import { seedDatabase } from "../prisma/seed/seed-database";
import { seedSnapshot as snapshot } from "../prisma/seed/snapshot";
import { TEST_USER_PASSWORD } from "../prisma/seed/test-users";

// Integration test: loads the development snapshot into the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const propertyIds = snapshot.properties.map((property) => property.id);
const inquiryIds = snapshot.inquiries.map((inquiry) => inquiry.id);
const emails = snapshot.users.map((user) => user.email);
const featureNames = snapshot.features.map((feature) => feature.name);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function countSnapshotRows() {
  const prisma = await getPrisma();
  return {
    features: await prisma.feature.count({ where: { name: { in: featureNames } } }),
    users: await prisma.user.count({ where: { email: { in: emails } } }),
    properties: await prisma.property.count({ where: { id: { in: propertyIds } } }),
    featureLinks: await prisma.propertyFeature.count({ where: { propertyId: { in: propertyIds } } }),
    images: await prisma.propertyImage.count({ where: { propertyId: { in: propertyIds } } }),
    favorites: await prisma.favorite.count({ where: { propertyId: { in: propertyIds } } }),
    inquiries: await prisma.inquiry.count({ where: { id: { in: inquiryIds } } }),
    messages: await prisma.inquiryMessage.count({ where: { inquiryId: { in: inquiryIds } } }),
  };
}

const expectedCounts = {
  features: snapshot.features.length,
  users: snapshot.users.length,
  properties: snapshot.properties.length,
  featureLinks: snapshot.properties.reduce((total, property) => total + property.featureIds.length, 0),
  images: snapshot.images.length,
  favorites: snapshot.favorites.length,
  inquiries: snapshot.inquiries.length,
  messages: snapshot.messages.length,
};

describe.skipIf(!hasDatabaseUrl)("seedDatabase (snapshot)", () => {
  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.inquiry.deleteMany({ where: { id: { in: inquiryIds } } });
    await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await prisma.feature.deleteMany({ where: { name: { in: featureNames } } });
    await prisma.$disconnect();
  });

  it("loads every table of the snapshot, keeping its ids", { timeout: 30_000 }, async () => {
    const prisma = await getPrisma();
    const summary = await seedDatabase(prisma);

    expect(summary).toEqual({
      features: expectedCounts.features,
      users: expectedCounts.users,
      properties: expectedCounts.properties,
      images: expectedCounts.images,
      favorites: expectedCounts.favorites,
      inquiries: expectedCounts.inquiries,
      messages: expectedCounts.messages,
    });
    expect(await countSnapshotRows()).toEqual(expectedCounts);
    const storedUsers = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
    expect(storedUsers.map((user) => user.id).sort()).toEqual(snapshot.users.map((user) => user.id).sort());
  });

  it("stores the data exactly as exported (decimals, dates, soft deletes, links)", { timeout: 30_000 }, async () => {
    const prisma = await getPrisma();
    for (const expected of snapshot.properties) {
      const stored = await prisma.property.findUniqueOrThrow({ where: { id: expected.id }, include: { features: true } });
      expect(stored.title).toBe(expected.title);
      expect(stored.price.toString()).toBe(expected.price);
      expect(stored.usableArea?.toString() ?? null).toBe(expected.usableArea);
      expect(stored.createdAt.toISOString()).toBe(expected.createdAt);
      expect(stored.deletedAt?.toISOString() ?? null).toBe(expected.deletedAt);
      expect(stored.features.map((link) => link.featureId).sort()).toEqual(expected.featureIds);
      // The search trigger fills searchText from the stored fields.
      expect(stored.searchText).toContain(expected.commune.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
    }

    for (const expected of snapshot.messages) {
      const stored = await prisma.inquiryMessage.findUniqueOrThrow({ where: { id: expected.id } });
      expect([stored.inquiryId, stored.authorId, stored.body, stored.createdAt.toISOString()]).toEqual([
        expected.inquiryId,
        expected.authorId,
        expected.body,
        expected.createdAt,
      ]);
    }
  });

  it("gives every user the test password", { timeout: 30_000 }, async () => {
    const prisma = await getPrisma();
    const { verifyPassword } = await import("@/lib/auth/password");
    const [user] = snapshot.users;
    const stored = await prisma.user.findUniqueOrThrow({ where: { email: user!.email } });
    await expect(verifyPassword(TEST_USER_PASSWORD, stored.passwordHash)).resolves.toBe(true);
  });

  it("can be re-run without duplicating rows and restores modified snapshot data", { timeout: 30_000 }, async () => {
    const prisma = await getPrisma();
    const [property] = snapshot.properties;
    const [user] = snapshot.users;
    await prisma.property.update({ where: { id: property!.id }, data: { title: "Modificada", features: { deleteMany: {} } } });
    await prisma.user.update({ where: { email: user!.email }, data: { name: "Otro nombre" } });

    await seedDatabase(prisma);

    expect(await countSnapshotRows()).toEqual(expectedCounts);
    expect((await prisma.property.findUniqueOrThrow({ where: { id: property!.id } })).title).toBe(property!.title);
    expect((await prisma.user.findUniqueOrThrow({ where: { email: user!.email } })).name).toBe(user!.name);
  });

  it("keeps images uploaded outside the snapshot and does not mix its images in", { timeout: 30_000 }, async () => {
    const prisma = await getPrisma();
    const property = snapshot.properties.find((candidate) => snapshot.images.some((image) => image.propertyId === candidate.id))!;
    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } });
    await prisma.propertyImage.create({
      data: { propertyId: property.id, url: "https://res.cloudinary.com/x/upload.jpg", publicId: "portal/uploaded-test", position: 0, isMain: true },
    });

    const summary = await seedDatabase(prisma);

    const images = await prisma.propertyImage.findMany({ where: { propertyId: property.id } });
    expect(images.map((image) => image.publicId)).toEqual(["portal/uploaded-test"]);
    expect(summary.images).toBe(expectedCounts.images - snapshot.images.filter((image) => image.propertyId === property.id).length);
    await prisma.propertyImage.deleteMany({ where: { publicId: "portal/uploaded-test" } });
  });
});

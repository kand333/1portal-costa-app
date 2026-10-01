import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";

// Integration test: verifies relations and constraints of the domain model in PostgreSQL.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const uniqueName = (label: string) => `${label}-${testRunId}-${randomUUID().slice(0, 8)}`;

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function createUser(overrides: { email?: string } = {}) {
  const prisma = await getPrisma();
  return prisma.user.create({
    data: {
      email: overrides.email ?? `${uniqueName("user")}@example.com`,
      passwordHash: "not-a-real-hash",
      name: "Test User",
    },
  });
}

async function createProperty(overrides: { price?: string } = {}) {
  const prisma = await getPrisma();
  return prisma.property.create({
    data: {
      title: uniqueName("property"),
      description: "Integration test property",
      operationType: "SALE",
      propertyType: "APARTMENT",
      price: overrides.price ?? "150000",
      usableArea: "80.5",
      bedrooms: 3,
      bathrooms: 2,
      address: "Av. Apoquindo 3000",
      commune: "Las Condes",
      city: "Santiago",
      region: "Región Metropolitana",
    },
  });
}

describe.skipIf(!hasDatabaseUrl)("domain model", () => {
  afterAll(async () => {
    const prisma = await getPrisma();
    const namePattern = { contains: testRunId };
    await prisma.inquiry.deleteMany({ where: { propertyTitle: namePattern } });
    await prisma.property.deleteMany({ where: { title: namePattern } });
    await prisma.feature.deleteMany({ where: { name: namePattern } });
    await prisma.user.deleteMany({ where: { email: namePattern } });
    await prisma.$disconnect();
  });

  it("applies defaults to new users and properties", async () => {
    const user = await createUser();
    const property = await createProperty();

    expect(user.role).toBe("USER");
    expect(user.isActive).toBe(true);
    expect(property.currency).toBe("USD");
    expect(property.isPublished).toBe(false);
    expect(property.isFeatured).toBe(false);
    expect(property.price.toString()).toBe("150000");
  });

  it("rejects duplicated user emails", async () => {
    const email = `${uniqueName("duplicate")}@example.com`;
    await createUser({ email });
    await expect(createUser({ email })).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects negative prices through a CHECK constraint", async () => {
    await expect(createProperty({ price: "-1" })).rejects.toThrow(/Property_price_non_negative_check/);
  });

  it("allows many features per property and many properties per feature", async () => {
    const prisma = await getPrisma();
    const [firstProperty, secondProperty] = await Promise.all([createProperty(), createProperty()]);
    const [pool, gym] = await Promise.all([
      prisma.feature.create({ data: { name: uniqueName("pool") } }),
      prisma.feature.create({ data: { name: uniqueName("gym") } }),
    ]);

    await prisma.propertyFeature.createMany({
      data: [
        { propertyId: firstProperty.id, featureId: pool.id },
        { propertyId: firstProperty.id, featureId: gym.id },
        { propertyId: secondProperty.id, featureId: pool.id },
      ],
    });

    expect(await prisma.propertyFeature.count({ where: { propertyId: firstProperty.id } })).toBe(2);
    expect(await prisma.propertyFeature.count({ where: { featureId: pool.id } })).toBe(2);
  });

  it("prevents deleting a feature that is in use", async () => {
    const prisma = await getPrisma();
    const property = await createProperty();
    const feature = await prisma.feature.create({ data: { name: uniqueName("in-use") } });
    await prisma.propertyFeature.create({ data: { propertyId: property.id, featureId: feature.id } });

    await expect(prisma.feature.delete({ where: { id: feature.id } })).rejects.toMatchObject({ code: "P2003" });
  });

  it("rejects duplicated favorites for the same user and property", async () => {
    const prisma = await getPrisma();
    const [user, property] = await Promise.all([createUser(), createProperty()]);
    const favorite = { userId: user.id, propertyId: property.id };

    await prisma.favorite.create({ data: favorite });
    await expect(prisma.favorite.create({ data: favorite })).rejects.toMatchObject({ code: "P2002" });
  });

  it("allows only one main image per property", async () => {
    const prisma = await getPrisma();
    const property = await createProperty();
    const image = (position: number, isMain: boolean) => ({
      propertyId: property.id,
      url: `https://res.cloudinary.com/demo/${uniqueName("image")}.jpg`,
      publicId: uniqueName("public-id"),
      position,
      isMain,
    });

    await prisma.propertyImage.create({ data: image(0, true) });
    await prisma.propertyImage.create({ data: image(1, false) });
    await prisma.propertyImage.create({ data: image(2, false) });
    await expect(prisma.propertyImage.create({ data: image(3, true) })).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("allows inquiries from visitors without a user", async () => {
    const prisma = await getPrisma();
    const property = await createProperty();

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: property.id,
        propertyTitle: property.title,
        name: "Visitor",
        email: "visitor@example.com",
        message: "Me interesa la propiedad",
      },
    });

    expect(inquiry.userId).toBeNull();
    expect(inquiry.phone).toBeNull();
  });

  it("cascades property children and keeps inquiries when a property is deleted", async () => {
    const prisma = await getPrisma();
    const [user, property] = await Promise.all([createUser(), createProperty()]);
    const feature = await prisma.feature.create({ data: { name: uniqueName("terrace") } });

    await prisma.propertyImage.create({
      data: { propertyId: property.id, url: "https://example.com/a.jpg", publicId: uniqueName("public-id"), position: 0, isMain: true },
    });
    await prisma.propertyFeature.create({ data: { propertyId: property.id, featureId: feature.id } });
    await prisma.favorite.create({ data: { userId: user.id, propertyId: property.id } });
    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: property.id,
        propertyTitle: property.title,
        userId: user.id,
        name: "User",
        email: user.email,
        message: "Consulta",
      },
    });

    await prisma.property.delete({ where: { id: property.id } });

    expect(await prisma.propertyImage.count({ where: { propertyId: property.id } })).toBe(0);
    expect(await prisma.propertyFeature.count({ where: { propertyId: property.id } })).toBe(0);
    expect(await prisma.favorite.count({ where: { propertyId: property.id } })).toBe(0);
    expect(await prisma.feature.findUnique({ where: { id: feature.id } })).not.toBeNull();

    const orphanInquiry = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
    expect(orphanInquiry.propertyId).toBeNull();
    expect(orphanInquiry.propertyTitle).toBe(property.title);
  });

  it("removes favorites and keeps inquiries when a user is deleted", async () => {
    const prisma = await getPrisma();
    const [user, property] = await Promise.all([createUser(), createProperty()]);
    await prisma.favorite.create({ data: { userId: user.id, propertyId: property.id } });
    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: property.id,
        propertyTitle: property.title,
        userId: user.id,
        name: "User",
        email: user.email,
        message: "Consulta",
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.favorite.count({ where: { userId: user.id } })).toBe(0);
    const inquiryAfterDeletion = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
    expect(inquiryAfterDeletion.userId).toBeNull();
  });
});

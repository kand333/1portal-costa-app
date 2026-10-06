import type { PrismaClient } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/auth/password";
import { seedSnapshot, type SeedSnapshot } from "./snapshot";
import { TEST_USER_PASSWORD } from "./test-users";

export type SeedSummary = {
  features: number;
  users: number;
  properties: number;
  images: number;
  favorites: number;
  inquiries: number;
  messages: number;
};

const date = (value: string) => new Date(value);
const optionalDate = (value: string | null) => (value ? new Date(value) : null);

/**
 * Loads the development snapshot (`snapshot.json`). Safe to re-run: every row keeps the id it
 * has in the snapshot and is upserted (features by name, users by email), so nothing is
 * duplicated and snapshot rows are restored to their exported state. Rows created outside the
 * snapshot are left untouched; a property with images uploaded outside it keeps them.
 * Every snapshot user gets TEST_USER_PASSWORD.
 */
export async function seedDatabase(prisma: PrismaClient, snapshot: SeedSnapshot = seedSnapshot): Promise<SeedSummary> {
  // A feature or user may already exist under another id (same name / email): map snapshot ids to stored ones.
  const featureIds = new Map<string, string>();
  for (const { id, name, createdAt } of snapshot.features) {
    const feature = await prisma.feature.upsert({ where: { name }, update: {}, create: { id, name, createdAt: date(createdAt) } });
    featureIds.set(id, feature.id);
  }

  const passwordHash = await hashPassword(TEST_USER_PASSWORD);
  const userIds = new Map<string, string>();
  for (const { id, email, name, role, isActive, createdAt } of snapshot.users) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role, isActive, passwordHash },
      create: { id, email, name, role, isActive, passwordHash, createdAt: date(createdAt) },
    });
    userIds.set(id, user.id);
  }
  const userId = (id: string | null) => (id === null ? null : (userIds.get(id) ?? null));

  const snapshotImageIds = new Set(snapshot.images.map((image) => image.id));
  let images = 0;
  for (const { id, featureIds: propertyFeatureIds, deletedAt, createdAt, ...fields } of snapshot.properties) {
    const data = { ...fields, deletedAt: optionalDate(deletedAt), createdAt: date(createdAt) };
    const featureLinks = propertyFeatureIds.map((featureId) => {
      const storedId = featureIds.get(featureId);
      if (!storedId) throw new Error(`Snapshot property "${fields.title}" uses unknown feature ${featureId}`);
      return { featureId: storedId };
    });
    const propertyImages = snapshot.images
      .filter((image) => image.propertyId === id)
      .map((image) => ({
        id: image.id,
        url: image.url,
        publicId: image.publicId,
        position: image.position,
        isMain: image.isMain,
        createdAt: date(image.createdAt),
      }));

    // Images uploaded outside the snapshot stay; then the snapshot's are not mixed in (single main image rule).
    const foreignImages = await prisma.propertyImage.count({ where: { propertyId: id, id: { notIn: [...snapshotImageIds] } } });
    const imageChanges = foreignImages > 0 ? undefined : { deleteMany: {}, create: propertyImages };
    if (imageChanges) images += propertyImages.length;

    await prisma.property.upsert({
      where: { id },
      create: { id, ...data, features: { create: featureLinks }, images: { create: propertyImages } },
      update: { ...data, features: { deleteMany: {}, create: featureLinks }, images: imageChanges },
    });
  }

  for (const favorite of snapshot.favorites) {
    const user = userId(favorite.userId);
    if (!user) continue;
    await prisma.favorite.upsert({
      where: { userId_propertyId: { userId: user, propertyId: favorite.propertyId } },
      update: {},
      create: { userId: user, propertyId: favorite.propertyId, createdAt: date(favorite.createdAt) },
    });
  }

  for (const { id, userId: inquiryUserId, createdAt, lastActivityAt, ...fields } of snapshot.inquiries) {
    const data = { ...fields, userId: userId(inquiryUserId), createdAt: date(createdAt), lastActivityAt: date(lastActivityAt) };
    await prisma.inquiry.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  for (const { id, authorId, createdAt, ...fields } of snapshot.messages) {
    const data = { ...fields, authorId: userId(authorId), createdAt: date(createdAt) };
    await prisma.inquiryMessage.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  return {
    features: snapshot.features.length,
    users: snapshot.users.length,
    properties: snapshot.properties.length,
    images,
    favorites: snapshot.favorites.length,
    inquiries: snapshot.inquiries.length,
    messages: snapshot.messages.length,
  };
}

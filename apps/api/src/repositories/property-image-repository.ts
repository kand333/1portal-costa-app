import "server-only";
import { prisma } from "@/lib/prisma";
import { SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } from "@/lib/seed-placeholder";

const imageSelect = { id: true, url: true, position: true, isMain: true } as const;

/** Whether ADMIN can add images to the property: it exists and is not soft-deleted. */
export function propertyAcceptsImages(propertyId: string): Promise<boolean> {
  return prisma.property.count({ where: { id: propertyId, deletedAt: null } }).then((count) => count > 0);
}

/**
 * Stores an image uploaded to Cloudinary, last in the gallery. The seed's placeholder photos are
 * replaced by the first real image (they are never mixed), and an image becomes the main one
 * when the property has no other.
 */
export function insertUploadedImage(propertyId: string, image: { url: string; publicId: string }) {
  return prisma.$transaction(async (transaction) => {
    await transaction.propertyImage.deleteMany({
      where: { propertyId, publicId: { startsWith: SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } },
    });
    const { _max, _count } = await transaction.propertyImage.aggregate({
      where: { propertyId },
      _max: { position: true },
      _count: true,
    });
    return transaction.propertyImage.create({
      data: { propertyId, ...image, position: (_max.position ?? -1) + 1, isMain: _count === 0 },
      select: imageSelect,
    });
  });
}

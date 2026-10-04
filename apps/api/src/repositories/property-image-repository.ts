import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/http/api-error";
import { prisma } from "@/lib/prisma";
import { SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } from "@/lib/seed-placeholder";
import { MAX_PROPERTY_IMAGES, PROPERTY_IMAGE_MESSAGES } from "@portal/shared/property-image";

const imageSelect = { id: true, url: true, position: true, isMain: true } as const;
const isPlaceholder = { publicId: { startsWith: SEED_PLACEHOLDER_PUBLIC_ID_PREFIX } } satisfies Prisma.PropertyImageWhereInput;

/** Images of a property that ADMIN can manage (it exists and is not soft-deleted), or null. */
export async function findManagedPropertyImages(propertyId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, deletedAt: null },
    select: { images: { select: { ...imageSelect, publicId: true }, orderBy: [{ position: "asc" }, { id: "asc" }] } },
  });
  return property?.images ?? null;
}

/** How many images an upload would leave: the seed placeholders do not count, they are replaced. */
export function countRealImages(propertyId: string): Promise<number> {
  return prisma.propertyImage.count({ where: { propertyId, NOT: isPlaceholder } });
}

/**
 * Stores an image uploaded to Cloudinary, last in the gallery. The seed's placeholder photos are
 * replaced by the first real image (they are never mixed), and an image becomes the main one
 * when the property has no other. Throws 409 past the image limit.
 */
export function insertUploadedImage(propertyId: string, image: { url: string; publicId: string }) {
  return prisma.$transaction(async (transaction) => {
    await transaction.propertyImage.deleteMany({ where: { propertyId, ...isPlaceholder } });
    const { _max, _count } = await transaction.propertyImage.aggregate({
      where: { propertyId },
      _max: { position: true },
      _count: true,
    });
    if (_count >= MAX_PROPERTY_IMAGES) throw new ApiError(409, PROPERTY_IMAGE_MESSAGES.tooMany);
    return transaction.propertyImage.create({
      data: { propertyId, ...image, position: (_max.position ?? -1) + 1, isMain: _count === 0 },
      select: imageSelect,
    });
  });
}

/**
 * Removes an image row and keeps the gallery consistent: positions 0..n-1 and, if it was the main
 * one, the first remaining image becomes the main one.
 */
export function deleteImageRow(propertyId: string, imageId: string) {
  return prisma.$transaction(async (transaction) => {
    await transaction.propertyImage.delete({ where: { id: imageId, propertyId } });
    const remaining = await transaction.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, isMain: true },
    });
    const hasMain = remaining.some((image) => image.isMain);
    for (const [index, image] of remaining.entries()) {
      await transaction.propertyImage.update({
        where: { id: image.id },
        data: { position: index, ...(hasMain ? {} : { isMain: index === 0 }) },
      });
    }
  });
}

/**
 * Applies a new order (positions 0..n-1 following `order`) and main image in one transaction.
 * The caller has checked that `order` has exactly the property's images.
 */
export function arrangeImages(propertyId: string, order: string[], mainImageId: string) {
  return prisma.$transaction(async (transaction) => {
    // First clear the main flag: at most one main image per property is enforced by an index.
    await transaction.propertyImage.updateMany({ where: { propertyId }, data: { isMain: false } });
    for (const [position, id] of order.entries()) {
      await transaction.propertyImage.update({
        where: { id, propertyId },
        data: { position, isMain: id === mainImageId },
      });
    }
    return transaction.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: imageSelect,
    });
  });
}

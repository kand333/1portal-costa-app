import "server-only";
import { prisma } from "@/lib/prisma";
import { propertySummarySelect, publishedOnly, type PropertySummaryRecord } from "@/repositories/property-repository";

/** Saved properties of a user that are still published, most recently saved first. */
export async function findFavoriteProperties(userId: string): Promise<PropertySummaryRecord[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId, property: publishedOnly },
    orderBy: { createdAt: "desc" },
    select: { property: { select: propertySummarySelect } },
  });
  return favorites.map((favorite) => favorite.property);
}

/** Saves a property; saving it again changes nothing (the composite primary key forbids duplicates). */
export async function saveFavorite(userId: string, propertyId: string): Promise<void> {
  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId, propertyId } },
    update: {},
    create: { userId, propertyId },
  });
}

/** Removes a saved property; removing one that is not saved changes nothing. */
export async function deleteFavorite(userId: string, propertyId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, propertyId } });
}

import "server-only";
import { prisma } from "@/lib/prisma";

const activeProperty = { property: { deletedAt: null } };

/** Every feature, by name, with how many active (not soft-deleted) properties use it. */
export async function findFeaturesWithUsage() {
  const features = await prisma.feature.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { properties: { where: activeProperty } } } },
  });
  return features.map(({ _count, ...feature }) => ({ ...feature, propertyCount: _count.properties }));
}

export function findFeatureById(id: string) {
  return prisma.feature.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { properties: { where: activeProperty } } } },
  });
}

/** Another feature with the same name ignoring case ("piscina" = "Piscina"), if any. */
export function findFeatureWithSameName(name: string, exceptId?: string) {
  return prisma.feature.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
}

export function insertFeature(name: string) {
  return prisma.feature.create({ data: { name }, select: { id: true, name: true } });
}

export function renameFeature(id: string, name: string) {
  return prisma.feature.update({ where: { id }, data: { name }, select: { id: true, name: true } });
}

/**
 * Deletes a feature that no active property uses: it is first detached from soft-deleted
 * properties (the link would otherwise block the delete).
 */
export function deleteFeatureDetached(id: string) {
  return prisma.$transaction([
    prisma.propertyFeature.deleteMany({ where: { featureId: id } }),
    prisma.feature.delete({ where: { id } }),
  ]);
}

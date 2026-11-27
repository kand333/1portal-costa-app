import "server-only";
import { prisma } from "@/lib/prisma";

const sectorOrder = [{ name: "asc" as const }];

/** Every city with its sectors: the reference table of the estimator and of the admin screen. */
export function listValuationCities() {
  return prisma.valuationCity.findMany({
    orderBy: { name: "asc" },
    include: { sectors: { orderBy: sectorOrder } },
  });
}

export function findValuationCityById(id: string) {
  return prisma.valuationCity.findUnique({ where: { id } });
}

export function findValuationSectorById(id: string) {
  return prisma.valuationSector.findUnique({ where: { id } });
}

export function createValuationCity(data: { name: string; houseUfPerM2: number; apartmentUfPerM2: number; landUfPerM2: number }) {
  return prisma.valuationCity.create({ data });
}

export function updateValuationCityBase(id: string, data: { houseUfPerM2: number; apartmentUfPerM2: number; landUfPerM2: number }) {
  return prisma.valuationCity.update({ where: { id }, data });
}

export function createValuationSector(data: {
  cityId: string;
  name: string;
  commune: string;
  latitude: number;
  longitude: number;
  coefficient: number;
  note: string;
  source: string;
}) {
  return prisma.valuationSector.create({ data });
}

export function updateValuationSector(
  id: string,
  data: Partial<{ name: string; commune: string; latitude: number; longitude: number; coefficient: number; note: string; source: string }>,
) {
  return prisma.valuationSector.update({ where: { id }, data });
}

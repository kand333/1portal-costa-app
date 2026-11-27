import type { PropertyType } from "@portal/shared/enums";

/** Base price of a city, in UF per square meter, by property type. */
export type ReferenceCity = { name: string; houseUfPerM2: number; apartmentUfPerM2: number; landUfPerM2: number };

/** A zone of a city with its own multiplier of the city's base price and its approximate centre. */
export type ReferenceSector = { name: string; commune: string; latitude: number; longitude: number; coefficient: number };

/** Where the reference came from, in the order the picker tries them. */
export type ReferencePick = {
  /** UF per square meter of built area for the requested type, already multiplied by the coefficient. */
  ufPerSquareMeter: number;
  /** Name of the sector that applied; null when only an average or the city base was used. */
  sector: string | null;
};

/** A commune the table does not know is priced as the default city, discounted by this share. */
export const OUTSIDE_COVERAGE_COEFFICIENT = 0.75;
/** Monthly rent as a share of the sale price (the reference table is for sales): median of 86 rent listings of Concepción against sale medians, 0,46 to 0,47 %. */
export const MONTHLY_RENT_YIELD = 0.0047;

const SALE_BASE: Record<"HOUSE" | "APARTMENT", keyof Omit<ReferenceCity, "name">> = {
  HOUSE: "houseUfPerM2",
  APARTMENT: "apartmentUfPerM2",
};

const sameCommune = (first: string, second: string) =>
  first.localeCompare(second, "es", { sensitivity: "base" }) === 0;

/** Flat-earth distance, enough to rank sectors of one city. */
function distance(latitude: number, longitude: number, sector: ReferenceSector): number {
  const dLatitude = latitude - sector.latitude;
  const dLongitude = (longitude - sector.longitude) * Math.cos((latitude * Math.PI) / 180);
  return dLatitude * dLatitude + dLongitude * dLongitude;
}

/**
 * Picks the sector that prices the property: the nearest one to its located address inside the commune;
 * without a location, the average coefficient of the commune's sectors; without sectors, the city base.
 */
export function pickReference(
  city: ReferenceCity,
  sectors: readonly ReferenceSector[],
  commune: string,
  propertyType: Extract<PropertyType, "HOUSE" | "APARTMENT">,
  location?: { latitude: number; longitude: number },
  coefficientWithoutSectors = 1,
): ReferencePick {
  const base = city[SALE_BASE[propertyType]];
  const inCommune = sectors.filter((sector) => sameCommune(sector.commune, commune));
  if (inCommune.length === 0) return { ufPerSquareMeter: base * coefficientWithoutSectors, sector: null };
  if (location) {
    const nearest = inCommune.reduce((best, sector) =>
      distance(location.latitude, location.longitude, sector) < distance(location.latitude, location.longitude, best) ? sector : best,
    );
    return { ufPerSquareMeter: base * nearest.coefficient, sector: nearest.name };
  }
  const average = inCommune.reduce((total, sector) => total + sector.coefficient, 0) / inCommune.length;
  return { ufPerSquareMeter: base * average, sector: null };
}

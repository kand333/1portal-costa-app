import "server-only";
import { getUfValue } from "@/lib/uf-value";
import { findComparableProperties } from "@/repositories/valuation-repository";
import { listValuationCities } from "@/repositories/valuation-sector-repository";
import { estimatePrice, MIN_COMPARABLES, type Comparable, type ReferencePrice } from "@/services/valuation-algorithm";
import {
  MONTHLY_RENT_YIELD,
  OUTSIDE_COVERAGE_COEFFICIENT,
  pickReference,
  type ReferenceCity,
  type ReferenceSector,
} from "@/services/valuation-reference";
import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";

/** The city used for communes the table does not know yet. */
const DEFAULT_CITY_NAME = "Concepción";
/** Last resort when the table is empty or deleted: a rough base so the estimate never fails. */
const FALLBACK_CITY: ReferenceCity = { name: DEFAULT_CITY_NAME, houseUfPerM2: 36, apartmentUfPerM2: 40, landUfPerM2: 6 };
/** Approximate value of the UF, used to turn the reference table (in UF) into pesos when the live value is down. */
const FALLBACK_UF_VALUE = 39_000;

async function loadComparables(request: ValuationRequest, commune?: string): Promise<Comparable[]> {
  const records = await findComparableProperties({
    propertyType: request.propertyType,
    operationType: request.operation,
    commune,
  });
  return records.map((record) => ({
    price: Number(record.price),
    area: Number(record.usableArea ?? record.totalArea),
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    parkingSpaces: record.parkingSpaces,
    ageInYears: record.ageInYears,
  }));
}

const sameName = (first: string, second: string) => first.localeCompare(second, "es", { sensitivity: "base" }) === 0;

/** The reference price per square meter of the request, from the sector table, in pesos (monthly for a rent). */
async function loadReference(request: ValuationRequest, ufValue: number | null): Promise<ReferencePrice> {
  const cities = await listValuationCities();
  const byCommune =
    cities.find((city) => city.sectors.some((sector) => sameName(sector.commune, request.commune))) ??
    cities.find((city) => sameName(city.name, request.commune));
  const city = byCommune ?? cities.find((candidate) => sameName(candidate.name, DEFAULT_CITY_NAME));
  const sectors: ReferenceSector[] = (city?.sectors ?? []).map((sector) => ({
    name: sector.name,
    commune: sector.commune,
    latitude: sector.latitude,
    longitude: sector.longitude,
    coefficient: sector.coefficient,
  }));
  const location =
    request.latitude !== undefined && request.longitude !== undefined ? { latitude: request.latitude, longitude: request.longitude } : undefined;
  // A known commune without sectors uses its city base as is; an unknown one is the default city, discounted.
  const coefficientWithoutSectors = byCommune ? 1 : OUTSIDE_COVERAGE_COEFFICIENT;
  const pick = pickReference(city ?? FALLBACK_CITY, sectors, request.commune, request.propertyType, location, coefficientWithoutSectors);
  const salePerSquareMeter = pick.ufPerSquareMeter * (ufValue ?? FALLBACK_UF_VALUE);
  return {
    pricePerSquareMeter: request.operation === "RENT" ? salePerSquareMeter * MONTHLY_RENT_YIELD : salePerSquareMeter,
    sector: pick.sector,
  };
}

/** Always returns a figure: the commune's comparables when there are enough, otherwise the portal's, blended with the sector reference. */
async function estimateInClp(request: ValuationRequest, ufValue: number | null): Promise<Extract<ValuationResult, { status: "ok" }>> {
  const reference = await loadReference(request, ufValue);
  const inCommune = await loadComparables(request, request.commune);
  if (inCommune.length >= MIN_COMPARABLES) return estimatePrice(inCommune, request, "commune", reference);
  return estimatePrice(await loadComparables(request), request, "portal", reference);
}

/** Sales also carry the figures in UF; rents stay in CLP per month. */
export async function estimateValuation(request: ValuationRequest): Promise<ValuationResult> {
  const value = await getUfValue();
  const result = await estimateInClp(request, value);
  if (request.operation !== "SALE" || value === null) return result;
  const toUf = (clp: number) => Math.round((clp / value) * 10) / 10;
  return { ...result, uf: { value, estimate: toUf(result.estimate), low: toUf(result.low), high: toUf(result.high) } };
}

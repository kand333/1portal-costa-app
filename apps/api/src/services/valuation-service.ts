import "server-only";
import { getUfValue } from "@/lib/uf-value";
import { findComparableProperties } from "@/repositories/valuation-repository";
import { estimatePrice, MIN_COMPARABLES, type Comparable } from "@/services/valuation-algorithm";
import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";

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
  }));
}

/** Estimates with the commune's own comparables; with too few it widens to the whole portal. */
async function estimateInClp(request: ValuationRequest): Promise<ValuationResult> {
  const inCommune = await loadComparables(request, request.commune);
  if (inCommune.length >= MIN_COMPARABLES) {
    const result = estimatePrice(inCommune, request, "commune");
    if (result.status === "ok") return result;
  }
  return estimatePrice(await loadComparables(request), request, "portal");
}

/** Sales also carry the figures in UF; rents stay in CLP per month. */
export async function estimateValuation(request: ValuationRequest): Promise<ValuationResult> {
  const result = await estimateInClp(request);
  if (result.status !== "ok" || request.operation !== "SALE") return result;
  const value = await getUfValue();
  if (value === null) return result;
  const toUf = (clp: number) => Math.round((clp / value) * 10) / 10;
  return { ...result, uf: { value, estimate: toUf(result.estimate), low: toUf(result.low), high: toUf(result.high) } };
}

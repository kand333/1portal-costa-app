import type { ValuationAmenity, ValuationRequest, ValuationResult, ValuationScope } from "@portal/shared/valuation";

/** A published property reduced to what the estimate needs. `area` is its built area (or total area). */
export type Comparable = {
  price: number;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
};

export const MIN_COMPARABLES = 3;
/** Each extra bedroom, bathroom or parking space moves the price by this share, capped in total. */
const ADJUSTMENT_PER_UNIT = { bedrooms: 0.03, bathrooms: 0.03, parkingSpaces: 0.02 } as const;
/** Declared constants, not measured: with so few comparables there is no data to derive them from. */
export const AMENITY_ADJUSTMENT: Record<ValuationAmenity, number> = {
  pool: 0.015,
  gym: 0.015,
  concierge: 0.015,
  garden: 0.015,
  heating: 0.015,
  heatedPool: 0.02,
};
const MAX_TOTAL_ADJUSTMENT = 0.15;

/** Linear-interpolated percentile of an ascending list (`share` between 0 and 1). */
export function percentile(sorted: readonly number[], share: number): number {
  if (sorted.length === 1) return sorted[0]!;
  const position = (sorted.length - 1) * share;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
}

/** Drops values outside 1.5 × IQR of the quartiles. Lists under four values are kept as they are. */
function withoutOutliers(sorted: readonly number[]): number[] {
  if (sorted.length < 4) return [...sorted];
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const margin = (q3 - q1) * 1.5;
  return sorted.filter((value) => value >= q1 - margin && value <= q3 + margin);
}

function median(values: readonly number[]): number | null {
  const present = values.filter((value) => Number.isFinite(value));
  if (present.length === 0) return null;
  return percentile([...present].sort((a, b) => a - b), 0.5);
}

/** Share by which the property differs from the typical comparable (and its amenities), bounded so one trait cannot dominate. */
function adjustmentFactor(request: ValuationRequest, comparables: readonly Comparable[]): number {
  const typical = {
    bedrooms: median(comparables.flatMap((comparable) => comparable.bedrooms ?? [])),
    bathrooms: median(comparables.flatMap((comparable) => comparable.bathrooms ?? [])),
    parkingSpaces: median(comparables.flatMap((comparable) => comparable.parkingSpaces ?? [])),
  };
  let adjustment = 0;
  for (const key of ["bedrooms", "bathrooms", "parkingSpaces"] as const) {
    const reference = typical[key];
    if (reference !== null) adjustment += (request[key] - reference) * ADJUSTMENT_PER_UNIT[key];
  }
  for (const amenity of request.amenities) adjustment += AMENITY_ADJUSTMENT[amenity];
  return 1 + Math.max(-MAX_TOTAL_ADJUSTMENT, Math.min(MAX_TOTAL_ADJUSTMENT, adjustment));
}

/**
 * Estimates the price of the requested property from comparable published ones: the median price per
 * square meter (outliers removed) times its built area, adjusted by bedrooms, bathrooms and parking
 * spaces. The range comes from the 25th and 75th percentile of the price per square meter.
 * With fewer than `MIN_COMPARABLES` valid comparables there is no estimate.
 */
export function estimatePrice(
  comparables: readonly Comparable[],
  request: ValuationRequest,
  scope: ValuationScope,
): ValuationResult {
  const valid = comparables.filter((comparable) => comparable.price > 0 && comparable.area > 0);
  if (valid.length < MIN_COMPARABLES) return { status: "insufficient" };

  const perSquareMeter = withoutOutliers(valid.map((comparable) => comparable.price / comparable.area).sort((a, b) => a - b));
  if (perSquareMeter.length < MIN_COMPARABLES) return { status: "insufficient" };

  const factor = adjustmentFactor(request, valid);
  const price = (pricePerSquareMeter: number) => Math.round(pricePerSquareMeter * request.usableArea * factor);
  const mid = percentile(perSquareMeter, 0.5);
  const low = price(percentile(perSquareMeter, 0.25));
  const high = price(percentile(perSquareMeter, 0.75));

  return {
    status: "ok",
    estimate: price(mid),
    low,
    high,
    pricePerSquareMeter: Math.round(mid),
    comparablesCount: perSquareMeter.length,
    scope,
    // The service adds the UF figures: they need the value of the day.
    uf: null,
  };
}

import type { ValuationAmenity, ValuationConfidence, ValuationRequest, ValuationResult, ValuationScope } from "@portal/shared/valuation";

/** A published property reduced to what the estimate needs. `area` is its built area (or total area). */
export type Comparable = {
  price: number;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  ageInYears: number | null;
};

/** What the sector table says the property is worth when the portal has no (or few) comparables. */
export type ReferencePrice = {
  /** CLP per square meter of built area (monthly for a rent). */
  pricePerSquareMeter: number;
  /** Name of the sector that applied, if any. */
  sector: string | null;
};

/** With this many valid comparables the estimate is `medium` confidence; from `HIGH_CONFIDENCE_COMPARABLES`, `high`. */
export const MIN_COMPARABLES = 3;
export const HIGH_CONFIDENCE_COMPARABLES = 10;
/** Comparables weigh `n / (n + REFERENCE_WEIGHT)` against the reference: 5 of them split it half and half. */
const REFERENCE_WEIGHT = 5;
/** Without comparables the range is the reference price ± this share. */
const REFERENCE_SPREAD = 0.12;

/** Each extra bedroom, bathroom or parking space moves the price by this share, capped in total. */
const ADJUSTMENT_PER_UNIT = { bedrooms: 0.03, bathrooms: 0.03, parkingSpaces: 0.02 } as const;
/** What a typical property of each type has, used when there are too few comparables to measure it. */
const TYPICAL_BY_TYPE = {
  APARTMENT: { bedrooms: 2, bathrooms: 1, parkingSpaces: 1 },
  HOUSE: { bedrooms: 3, bathrooms: 2, parkingSpaces: 1 },
} as const;
/** Declared constants, not measured: with so few comparables there is no data to derive them from. */
export const AMENITY_ADJUSTMENT: Record<ValuationAmenity, number> = {
  pool: 0.015,
  gym: 0.015,
  concierge: 0.015,
  garden: 0.015,
  heating: 0.015,
  storage: 0.02,
};
const MAX_TOTAL_ADJUSTMENT = 0.15;

/** Age of the typical property of a sector. A newer building is worth more, an older one less. */
export const TYPICAL_AGE_IN_YEARS = 15;
/** Each year of difference in age moves the price by this share: the data point with the most weight. */
export const AGE_ADJUSTMENT_PER_YEAR = 0.007;
const MIN_AGE_FACTOR = 0.82;
const MAX_AGE_FACTOR = 1.1;

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

/** Factor for the construction year, against the typical age (measured from the comparables when there are enough). */
export function ageFactor(constructionYear: number, currentYear: number, typicalAge: number): number {
  const age = Math.max(0, currentYear - constructionYear);
  const factor = 1 + (typicalAge - age) * AGE_ADJUSTMENT_PER_YEAR;
  return Math.max(MIN_AGE_FACTOR, Math.min(MAX_AGE_FACTOR, factor));
}

/** Share by which rooms and amenities move the price, bounded so one trait cannot dominate. */
function roomsAndAmenitiesFactor(request: ValuationRequest, comparables: readonly Comparable[]): number {
  const measured = comparables.length >= MIN_COMPARABLES;
  const defaults = TYPICAL_BY_TYPE[request.propertyType];
  const typical = {
    bedrooms: (measured ? median(comparables.flatMap((comparable) => comparable.bedrooms ?? [])) : null) ?? defaults.bedrooms,
    bathrooms: (measured ? median(comparables.flatMap((comparable) => comparable.bathrooms ?? [])) : null) ?? defaults.bathrooms,
    parkingSpaces: (measured ? median(comparables.flatMap((comparable) => comparable.parkingSpaces ?? [])) : null) ?? defaults.parkingSpaces,
  };
  let adjustment = 0;
  for (const key of ["bedrooms", "bathrooms", "parkingSpaces"] as const) {
    adjustment += (request[key] - typical[key]) * ADJUSTMENT_PER_UNIT[key];
  }
  for (const amenity of request.amenities) adjustment += AMENITY_ADJUSTMENT[amenity];
  return 1 + Math.max(-MAX_TOTAL_ADJUSTMENT, Math.min(MAX_TOTAL_ADJUSTMENT, adjustment));
}

function confidenceFor(comparablesCount: number): ValuationConfidence {
  if (comparablesCount >= HIGH_CONFIDENCE_COMPARABLES) return "high";
  if (comparablesCount >= MIN_COMPARABLES) return "medium";
  return "low";
}

/**
 * Estimates the price of the requested property. It always returns a figure:
 * - the reference price per square meter of its sector (table kept by hand in the admin), and
 * - the median of comparable published properties (outliers removed), weighted `n / (n + 5)` against it,
 *   so every published property sharpens the figure and none is needed to get one;
 * - times its built area, adjusted by bedrooms, bathrooms, parking spaces and amenities (bounded) and by
 *   construction year (against the typical age of the comparables, or 15 years).
 * The range comes from the 25th and 75th percentile of the price per square meter with at least
 * `MIN_COMPARABLES` comparables, widening toward the reference ± 12 % as they get scarcer.
 */
export function estimatePrice(
  comparables: readonly Comparable[],
  request: ValuationRequest,
  scope: ValuationScope,
  reference: ReferencePrice,
  currentYear = new Date().getFullYear(),
): Extract<ValuationResult, { status: "ok" }> {
  const valid = comparables.filter((comparable) => comparable.price > 0 && comparable.area > 0);
  const perSquareMeter = withoutOutliers(valid.map((comparable) => comparable.price / comparable.area).sort((a, b) => a - b));
  const count = perSquareMeter.length;
  const marketWeight = count / (count + REFERENCE_WEIGHT);

  const referenceLow = reference.pricePerSquareMeter * (1 - REFERENCE_SPREAD);
  const referenceHigh = reference.pricePerSquareMeter * (1 + REFERENCE_SPREAD);
  const marketMid = count > 0 ? percentile(perSquareMeter, 0.5) : reference.pricePerSquareMeter;
  const marketLow = count >= MIN_COMPARABLES ? percentile(perSquareMeter, 0.25) : marketMid * (1 - REFERENCE_SPREAD);
  const marketHigh = count >= MIN_COMPARABLES ? percentile(perSquareMeter, 0.75) : marketMid * (1 + REFERENCE_SPREAD);
  const blend = (market: number, fromReference: number) => marketWeight * market + (1 - marketWeight) * fromReference;

  const typicalAge = count >= MIN_COMPARABLES ? (median(valid.flatMap((comparable) => comparable.ageInYears ?? [])) ?? TYPICAL_AGE_IN_YEARS) : TYPICAL_AGE_IN_YEARS;
  const factor = roomsAndAmenitiesFactor(request, valid) * ageFactor(request.constructionYear, currentYear, typicalAge);
  const price = (pricePerSquareMeter: number) => Math.round(pricePerSquareMeter * request.usableArea * factor);
  const mid = blend(marketMid, reference.pricePerSquareMeter);

  return {
    status: "ok",
    estimate: price(mid),
    low: price(blend(marketLow, referenceLow)),
    high: price(blend(marketHigh, referenceHigh)),
    pricePerSquareMeter: Math.round(mid),
    comparablesCount: count,
    scope,
    // The service adds the UF figures: they need the value of the day.
    uf: null,
    basis: count === 0 ? "reference" : marketWeight >= 0.5 ? "comparables" : "mixed",
    confidence: confidenceFor(count),
    sector: reference.sector,
  };
}

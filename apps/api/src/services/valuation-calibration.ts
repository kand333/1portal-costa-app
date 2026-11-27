import { percentile } from "@/services/valuation-algorithm";

/** One real listing read from a portal or Facebook, reduced to what the calibration needs (no personal data). */
export type ValuationSample = {
  /** Where it was read: "portalinmobiliario", "yapo", "toctoc", "facebook"… */
  platform: string;
  url: string;
  /** Date the listing was read, `YYYY-MM-DD`. */
  capturedOn: string;
  city: string;
  commune: string;
  sector: string;
  propertyType: "APARTMENT" | "HOUSE" | "LAND";
  operation: "SALE" | "RENT";
  /** Sale price in UF (sales only). */
  priceUf: number | null;
  /** Monthly rent in pesos (rents only). */
  rentClp: number | null;
  /** Built area for apartments and houses; land area for land. */
  area: number;
  bedrooms: number | null;
  constructionYear: number | null;
  isNewProject: boolean;
};

export type SaleType = ValuationSample["propertyType"];

/** Weight of the neutral coefficient (1) against the sector's own samples: `c = (n·c + k) / (n + k)`. */
export const SHRINKAGE = 4;
/** A sector needs this many samples of a type to count toward the city base of that type. */
export const MIN_SAMPLES_FOR_BASE = 3;

/** Drops values outside 1.5 × IQR of the quartiles; lists under four values are kept. */
export function withoutOutliers(values: readonly number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length < 4) return sorted;
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const margin = (q3 - q1) * 1.5;
  return sorted.filter((value) => value >= q1 - margin && value <= q3 + margin);
}

/** Median after dropping outliers; null for an empty list. */
export function trimmedMedian(values: readonly number[]): number | null {
  const kept = withoutOutliers(values.filter((value) => Number.isFinite(value) && value > 0));
  return kept.length === 0 ? null : percentile(kept, 0.5);
}

/** Price in UF per square meter of a sale sample (built area, or land area for land). */
export function ufPerSquareMeter(sample: ValuationSample): number | null {
  if (sample.operation !== "SALE" || sample.priceUf === null || sample.area <= 0) return null;
  return sample.priceUf / sample.area;
}

const saleSamples = (samples: readonly ValuationSample[]) =>
  samples.filter((sample) => sample.operation === "SALE" && !sample.isNewProject && ufPerSquareMeter(sample) !== null);

export type TypeMedians = Partial<Record<SaleType, { median: number; count: number }>>;

export type SectorCalibration = {
  sector: string;
  commune: string;
  /** Number of sale samples of every type behind the coefficient. */
  count: number;
  medians: TypeMedians;
  /** Raw ratio against the city base, before shrinking. */
  rawCoefficient: number | null;
  /** Shrunk toward 1 with few samples: the value to store. */
  coefficient: number;
};

export type CityCalibration = {
  base: Partial<Record<SaleType, number>>;
  sectors: SectorCalibration[];
};

function mediansOf(samples: readonly ValuationSample[]): TypeMedians {
  const result: TypeMedians = {};
  for (const type of ["APARTMENT", "HOUSE", "LAND"] as const) {
    const values = samples.filter((sample) => sample.propertyType === type).map((sample) => ufPerSquareMeter(sample)!);
    const median = trimmedMedian(values);
    if (median !== null) result[type] = { median, count: values.length };
  }
  return result;
}

/**
 * Turns the samples of one city into a base price per type (the median of its sectors' medians) and one
 * coefficient per sector (its median over the base, averaged by sample count across types and shrunk toward 1).
 */
export function calibrateCity(samples: readonly ValuationSample[], shrinkage = SHRINKAGE): CityCalibration {
  const sales = saleSamples(samples);
  const bySector = new Map<string, ValuationSample[]>();
  for (const sample of sales) bySector.set(sample.sector, [...(bySector.get(sample.sector) ?? []), sample]);

  const medians = new Map([...bySector].map(([sector, group]) => [sector, mediansOf(group)]));
  const base: CityCalibration["base"] = {};
  for (const type of ["APARTMENT", "HOUSE", "LAND"] as const) {
    const sectorMedians = [...medians.values()].flatMap((entry) => (entry[type] && entry[type].count >= MIN_SAMPLES_FOR_BASE ? [entry[type].median] : []));
    const median = trimmedMedian(sectorMedians);
    if (median !== null) base[type] = median;
  }

  const sectors = [...bySector].map(([sector, group]): SectorCalibration => {
    const entry = medians.get(sector)!;
    let weighted = 0;
    let count = 0;
    for (const type of ["APARTMENT", "HOUSE", "LAND"] as const) {
      const median = entry[type];
      const reference = base[type];
      if (!median || !reference) continue;
      weighted += (median.median / reference) * median.count;
      count += median.count;
    }
    const rawCoefficient = count > 0 ? weighted / count : null;
    const coefficient = rawCoefficient === null ? 1 : (count * rawCoefficient + shrinkage) / (count + shrinkage);
    return { sector, commune: group[0]!.commune, count: group.length, medians: entry, rawCoefficient, coefficient };
  });
  return { base, sectors };
}

export type Validation = {
  /** Sale samples of apartments and houses that could be predicted. */
  tested: number;
  /** Mean absolute percentage error of the predicted UF per square meter. */
  mape: number;
  /** Share of samples whose prediction is within ±20 % of the published price per square meter. */
  within20: number;
};

/**
 * Leave-one-out check: each apartment/house sale is predicted with the calibration built without it
 * (base of its type × coefficient of its sector) and compared with its published price per square meter.
 */
export function validate(samples: readonly ValuationSample[]): Validation {
  const sales = saleSamples(samples).filter((sample) => sample.propertyType !== "LAND");
  let errorSum = 0;
  let within = 0;
  let tested = 0;
  for (const sample of sales) {
    const calibration = calibrateCity(samples.filter((other) => other !== sample));
    const base = calibration.base[sample.propertyType];
    const coefficient = calibration.sectors.find((sector) => sector.sector === sample.sector)?.coefficient ?? 1;
    const actual = ufPerSquareMeter(sample)!;
    if (base === undefined) continue;
    const predicted = base * coefficient;
    const error = Math.abs(predicted - actual) / actual;
    errorSum += error;
    if (error <= 0.2) within += 1;
    tested += 1;
  }
  return { tested, mape: tested ? errorSum / tested : 0, within20: tested ? within / tested : 0 };
}

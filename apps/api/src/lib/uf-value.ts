const UF_URL = "https://mindicador.cl/api/uf";
const CACHE_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 4000;

/** Value of the UF in CLP and the day (`YYYY-MM-DD`) it is valid for. */
export type UfQuote = { value: number; date: string };

let cached: (UfQuote & { fetchedAt: number }) | null = null;

/** Clears the cache. For tests only. */
export function resetUfCache() {
  cached = null;
}

/**
 * The UF of today in CLP with its date, from mindicador.cl (public, no key). Cached in memory for 6 hours.
 * Returns null on any failure, so callers show CLP only instead of inventing a rate.
 */
export async function getUfQuote(now: number = Date.now()): Promise<UfQuote | null> {
  if (cached && now - cached.fetchedAt < CACHE_MS) return cached;
  // A stale rate is better than none: it only moves by a fraction of a percent per day.
  const stale = cached ? { value: cached.value, date: cached.date } : null;
  try {
    const response = await fetch(UF_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return stale;
    const body = (await response.json()) as { serie?: { valor?: unknown; fecha?: unknown }[] };
    const entry = body.serie?.[0];
    const value = entry?.valor;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return stale;
    const date = typeof entry?.fecha === "string" ? entry.fecha.slice(0, 10) : "";
    cached = { value, date, fetchedAt: now };
    return { value, date };
  } catch {
    return stale;
  }
}

/** Value of the UF in CLP today, or null. See `getUfQuote`. */
export async function getUfValue(now: number = Date.now()): Promise<number | null> {
  return (await getUfQuote(now))?.value ?? null;
}

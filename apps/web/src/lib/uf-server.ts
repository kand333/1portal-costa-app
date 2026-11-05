const UF_URL = "https://mindicador.cl/api/uf";
const REVALIDATE_SECONDS = 6 * 60 * 60;
const TIMEOUT_MS = 4000;

/** Today's UF in CLP from mindicador.cl (public, no key; nothing about the visitor is sent), or null on any failure. */
export async function fetchUfValue(): Promise<number | null> {
  try {
    const response = await fetch(UF_URL, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) return null;
    const body = (await response.json()) as { serie?: { valor?: unknown }[] };
    const value = body.serie?.[0]?.valor;
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** "UF $41.269": whole pesos with Chilean separators. */
export function formatUf(value: number): string {
  return `UF $${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(value)}`;
}

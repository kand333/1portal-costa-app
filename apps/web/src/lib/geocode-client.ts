import type { MapLocation } from "./property-location";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const COUNTRY = "Chile";

type NominatimResult = { lat: string; lon: string };

/** Map shown before any address is typed: Gran Concepción. */
export const DEFAULT_MAP_LOCATION: MapLocation = { latitude: -36.827, longitude: -73.0503, zoom: 12 };
const COMMUNE_ZOOM = 13;
const ADDRESS_ZOOM = 16;

async function search(query: string, signal: AbortSignal): Promise<{ latitude: number; longitude: number } | null> {
  const params = new URLSearchParams({ format: "jsonv2", limit: "1", countrycodes: "cl", q: query });
  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, { headers: { "Accept-Language": "es" }, signal });
  if (!response.ok) return null;
  const [result] = (await response.json()) as NominatimResult[];
  if (!result) return null;
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

/**
 * Finds a point for the map from the browser (Nominatim, no key). Tries the street inside the commune and
 * falls back to the commune alone. Returns null on any failure: the map then just stays where it was.
 */
export async function locateInBrowser(
  parts: { address: string; commune: string },
  signal: AbortSignal,
): Promise<MapLocation | null> {
  const address = parts.address.trim();
  const commune = parts.commune.trim();
  try {
    if (address.length >= 3) {
      const exact = await search([address, commune, COUNTRY].filter(Boolean).join(", "), signal);
      if (exact) return { ...exact, zoom: ADDRESS_ZOOM };
    }
    if (commune) {
      const approximate = await search(`${commune}, ${COUNTRY}`, signal);
      if (approximate) return { ...approximate, zoom: COMMUNE_ZOOM };
    }
  } catch {
    return null;
  }
  return null;
}

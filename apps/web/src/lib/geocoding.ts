import { buildMapQuery, type AddressParts, type MapLocation } from "./property-location";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const EXACT_ZOOM = 16;
const APPROXIMATE_ZOOM = 13;
const CACHE_SECONDS = 60 * 60 * 24 * 30;

type NominatimResult = { lat: string; lon: string };

async function searchNominatim(query: string): Promise<{ latitude: number; longitude: number } | null> {
  const searchParams = new URLSearchParams({ format: "jsonv2", limit: "1", countrycodes: "cl", q: query });
  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${searchParams}`, {
    // Nominatim's usage policy requires an identifying User-Agent and caching of results.
    headers: {
      "User-Agent": `PortalInmobiliario/0.1 (+${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"})`,
      "Accept-Language": "es",
    },
    next: { revalidate: CACHE_SECONDS },
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) return null;

  const [result] = (await response.json()) as NominatimResult[];
  if (!result) return null;
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

/**
 * Finds the point of an address with Nominatim (OpenStreetMap), for Server Components. When the street
 * is not found it falls back to the commune, with a wider zoom. Returns null on any failure, so the
 * page still renders (only the map link is shown).
 * ponytail: geocodes on page render (cached 30 days; Nominatim allows ~1 request/s). With real traffic,
 * store the coordinates in the database from the API when a property is saved, transparently for ADMIN.
 */
export async function geocodeAddress(parts: AddressParts): Promise<MapLocation | null> {
  try {
    const exact = await searchNominatim(buildMapQuery(parts));
    if (exact) return { ...exact, zoom: EXACT_ZOOM };

    const approximate = await searchNominatim(buildMapQuery({ ...parts, address: "" }));
    return approximate ? { ...approximate, zoom: APPROXIMATE_ZOOM } : null;
  } catch {
    return null;
  }
}

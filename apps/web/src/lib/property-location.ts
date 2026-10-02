/** Every published property is in Chile; the country is not stored, so it is added to map searches. */
const COUNTRY = "Chile";

export type AddressParts = {
  address: string;
  commune: string;
  city: string;
  region: string;
};

/** Point to show on the map; `zoom` is closer for an exact address than for an approximate one. */
export type MapLocation = {
  latitude: number;
  longitude: number;
  zoom: number;
};

/**
 * Postal address shown on the detail page, e.g. "Av. Apoquindo 4500, Las Condes, Santiago, Región
 * Metropolitana". Empty parts are skipped and a repeated name (commune equal to its city) appears once.
 */
export function formatPropertyAddress(parts: AddressParts): string {
  const names = [parts.address, parts.commune, parts.city, parts.region]
    .map((name) => name.trim())
    .filter((name) => name !== "");
  return names.filter((name, index) => name !== names[index - 1]).join(", ");
}

/** Text to geocode: the address plus the country. No coordinates are stored or required. */
export function buildMapQuery(parts: AddressParts): string {
  return `${formatPropertyAddress(parts)}, ${COUNTRY}`;
}

/**
 * Public Google Maps link (no key needed) searching the address. The address is used instead of the
 * geocoded point, which may only be the commune when the street was not found.
 */
export function buildGoogleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}

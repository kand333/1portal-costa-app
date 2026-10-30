import type { LocationOption } from "./property";

/**
 * Where PropiZoom sells, in the order the catalog filters list it: region, city and sector.
 * Property rows keep these as plain text (`region`, `city`, `commune` = sector); the slugs below are
 * what the URL and the API filters use, and they must match `apps/api/src/lib/slug.ts`.
 */

/** URL-safe identifier of a location name, insensitive to case and accents ("Ñuñoa" -> "nunoa"). */
export function toLocationSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const option = (name: string): LocationOption => ({ name, slug: toLocationSlug(name) });

/**
 * The two areas under «Región del Bío-Bío». `name` is the value stored in `Property.region` (and the
 * source of the slug, so URLs and data stay as they are); `label` is what visitors read.
 */
export type RegionOption = LocationOption & { label: string };

const region = (name: string, label: string): RegionOption => ({ ...option(name), label });

/** Title of the filter (and of the admin field) whose options are `REGIONS`. */
export const REGION_FIELD_LABEL = "Región del Bío-Bío";

export const REGIONS: readonly RegionOption[] = [region("Región del Biobío", "Gran Concepción"), region("Provincia Arauco", "Provincia de Arauco")];

/** The area the catalog shows by default. */
export const DEFAULT_REGION: RegionOption = REGIONS[0];
export const DEFAULT_REGION_SLUG = DEFAULT_REGION.slug;
export const ARAUCO_REGION: RegionOption = REGIONS[1];

const GRAN_CONCEPCION_CITIES = [
  "Concepción",
  "San Pedro de la Paz",
  "Chiguayante",
  "Hualpén",
  "Talcahuano",
  "Penco",
  "Tomé",
  "Hualqui",
  "Coronel",
  "Lota",
];

const ARAUCO_CITIES = ["Arauco", "Cañete", "Contulmo", "Curanilahue", "Lebu", "Los Álamos", "Tirúa"];

const CITIES_BY_REGION: Readonly<Record<string, readonly LocationOption[]>> = {
  [DEFAULT_REGION.slug]: GRAN_CONCEPCION_CITIES.map(option),
  [ARAUCO_REGION.slug]: ARAUCO_CITIES.map(option),
};

/** Sectors are only defined for Concepción for now; add the other cities here when their lists exist. */
const SECTORS_BY_CITY: Readonly<Record<string, readonly LocationOption[]>> = {
  [toLocationSlug("Concepción")]: [
    "Centro de Concepción",
    "Barrio Universitario",
    "Barrio Norte",
    "Santa Sabina",
    "Collao",
    "Nonguén",
    "Lorenzo Arenas",
    "Laguna Redonda",
    "Pedro de Valdivia",
    "Lomas de San Andrés",
    "Lomas de San Sebastián",
    "Torreones",
    "Lomas de Bellavista",
    "Valle Noble",
    "Valle Andalién",
  ].map(option),
};

/** Cities of a region (by region slug); an unknown region has none. */
export function citiesOfRegion(regionSlug: string): readonly LocationOption[] {
  return CITIES_BY_REGION[regionSlug] ?? [];
}

/** Sectors of a city (by city slug); empty when the city has no sector list yet. */
export function sectorsOfCity(citySlug: string): readonly LocationOption[] {
  return SECTORS_BY_CITY[citySlug] ?? [];
}

/** The region a city belongs to, if it is one of ours. */
export function regionOfCity(citySlug: string): LocationOption | undefined {
  return REGIONS.find((region) => citiesOfRegion(region.slug).some((city) => city.slug === citySlug));
}

/** Sector stored for properties of a city that has no sector list: «Centro de <ciudad>». */
export function centerSectorOf(cityName: string): string {
  return `Centro de ${cityName}`;
}

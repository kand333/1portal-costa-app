import type { PropertyType } from "@portal/shared/enums";
import { SITE_NAME } from "./property-metadata";

type LandingType = {
  singular: string;
  plural: string;
  /** Grammatical gender in Spanish: "una casa" / "un departamento", "publicadas" / "publicados", "todas" / "todos". */
  article: "una" | "un";
  published: "publicadas" | "publicados";
  all: "todas las" | "todos los";
  propertyType: PropertyType;
  /** What moves the value of this kind of property: generic, not market data. */
  factors: readonly string[];
};

type LandingCommune = { name: string; citySlug: string };

const LANDING_TYPES = {
  casa: {
    singular: "casa",
    plural: "casas",
    article: "una",
    published: "publicadas",
    all: "todas las",
    propertyType: "HOUSE",
    factors: [
      "La superficie del terreno y la superficie construida.",
      "El sector o barrio y su acceso a colegios, comercio y transporte.",
      "La antigüedad, el estado general y las ampliaciones o remodelaciones.",
      "Dormitorios, baños y estacionamientos.",
    ],
  },
  departamento: {
    singular: "departamento",
    plural: "departamentos",
    article: "un",
    published: "publicados",
    all: "todos los",
    propertyType: "APARTMENT",
    factors: [
      "Los metros cuadrados útiles y la distribución.",
      "El sector, el piso y la orientación.",
      "Los gastos comunes, el estacionamiento y la bodega.",
      "La antigüedad y el estado del edificio y de la unidad.",
    ],
  },
} as const satisfies Record<string, LandingType>;

/** Only Concepción for now: more communes are added here once the first one brings leads. */
const LANDING_COMMUNES = {
  concepcion: { name: "Concepción", citySlug: "concepcion" },
} as const satisfies Record<string, LandingCommune>;

export type ValuationLanding = LandingType & {
  typeSlug: keyof typeof LANDING_TYPES;
  communeSlug: keyof typeof LANDING_COMMUNES;
  commune: LandingCommune;
  path: string;
};

const has = <Table extends object>(table: Table, key: string): key is Extract<keyof Table, string> =>
  Object.hasOwn(table, key);

/** The landing for a type and commune, or null when it does not exist (a 404). */
export function getValuationLanding(typeSlug: string, communeSlug: string): ValuationLanding | null {
  if (!has(LANDING_TYPES, typeSlug) || !has(LANDING_COMMUNES, communeSlug)) return null;
  return {
    ...LANDING_TYPES[typeSlug],
    typeSlug,
    communeSlug,
    commune: LANDING_COMMUNES[communeSlug],
    path: `/tasacion/${typeSlug}/${communeSlug}`,
  };
}

/** Every landing, for `generateStaticParams` and the sitemap. */
export function listValuationLandings(): ValuationLanding[] {
  return Object.keys(LANDING_TYPES).flatMap((typeSlug) =>
    Object.keys(LANDING_COMMUNES).flatMap((communeSlug) => getValuationLanding(typeSlug, communeSlug) ?? []),
  );
}

export function valuationLandingTitle(landing: ValuationLanding): string {
  return `Tasación de ${landing.plural} en ${landing.commune.name} gratis | ${SITE_NAME}`;
}

export function valuationLandingDescription(landing: ValuationLanding): string {
  return `¿Cuánto vale tu ${landing.singular} en ${landing.commune.name}? Estima gratis su precio de venta o arriendo y habla con una corredora local del Gran Concepción.`;
}

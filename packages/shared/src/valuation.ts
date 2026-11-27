import { z } from "zod";
import { OPERATION_TYPES } from "./enums";
import { LEAD_ADDRESS_MAX_LENGTH, LEAD_COMMUNE_MAX_LENGTH } from "./lead";

/** Property types the price estimator covers. */
export const VALUATION_PROPERTY_TYPES = ["HOUSE", "APARTMENT"] as const;

/** Amenities that can refine the estimate, with the label shown in the form. */
export const VALUATION_AMENITIES = ["pool", "gym", "concierge", "garden", "heating", "storage"] as const;
export type ValuationAmenity = (typeof VALUATION_AMENITIES)[number];
export const VALUATION_AMENITY_LABELS: Record<ValuationAmenity, string> = {
  pool: "Piscina",
  gym: "Gimnasio",
  concierge: "Conserjería",
  garden: "Jardín",
  heating: "Calefacción",
  storage: "Bodega",
};

/** Oldest construction year the form accepts; the newest is the current year. */
export const VALUATION_MIN_CONSTRUCTION_YEAR = 1900;

export const VALUATION_MIN_AREA = 10;
export const VALUATION_MAX_AREA = 10_000;
/** "6+" bedrooms and bathrooms and "5+" parking spaces are sent as the cap. */
export const VALUATION_MAX_BEDROOMS = 6;
export const VALUATION_MAX_BATHROOMS = 6;
export const VALUATION_MAX_PARKING_SPACES = 5;

const area = (label: string) =>
  z
    .number({ error: `Ingresa los m² ${label}` })
    .min(VALUATION_MIN_AREA, { error: `Los m² ${label} deben ser al menos ${VALUATION_MIN_AREA}` })
    .max(VALUATION_MAX_AREA, { error: `Los m² ${label} no pueden superar ${VALUATION_MAX_AREA}` });

/** Body of `POST /api/valuations`. The same rules validate the form in the browser. */
export const valuationRequestSchema = z
  .object({
    address: z
      .string({ error: "Ingresa la dirección" })
      .trim()
      .min(3, { error: "Ingresa la dirección" })
      .max(LEAD_ADDRESS_MAX_LENGTH, { error: `La dirección admite hasta ${LEAD_ADDRESS_MAX_LENGTH} caracteres` }),
    commune: z
      .string({ error: "Selecciona la comuna" })
      .trim()
      .min(1, { error: "Selecciona la comuna" })
      .max(LEAD_COMMUNE_MAX_LENGTH, { error: "La comuna es demasiado larga" }),
    propertyType: z.enum(VALUATION_PROPERTY_TYPES, { error: "Elige casa o departamento" }),
    operation: z.enum(OPERATION_TYPES, { error: "Elige venta o arriendo" }),
    totalArea: area("totales"),
    usableArea: area("construidos"),
    bedrooms: z
      .number({ error: "Elige los dormitorios" })
      .int({ error: "Elige los dormitorios" })
      .min(1, { error: "Elige los dormitorios" })
      .max(VALUATION_MAX_BEDROOMS, { error: "Elige los dormitorios" }),
    bathrooms: z
      .number({ error: "Elige los baños" })
      .int({ error: "Elige los baños" })
      .min(1, { error: "Elige los baños" })
      .max(VALUATION_MAX_BATHROOMS, { error: "Elige los baños" }),
    parkingSpaces: z
      .number({ error: "Elige los estacionamientos" })
      .int({ error: "Elige los estacionamientos" })
      .min(0, { error: "Elige los estacionamientos" })
      .max(VALUATION_MAX_PARKING_SPACES, { error: "Elige los estacionamientos" }),
    /** Optional: each one nudges the price up a little. Repeated values count once. */
    amenities: z
      .array(z.enum(VALUATION_AMENITIES, { error: "Amenidad inválida" }))
      .default([])
      .transform((amenities) => [...new Set(amenities)]),
    /** Year the building was finished: the older the property, the lower the price (see the algorithm). */
    constructionYear: z
      .number({ error: "Ingresa el año de construcción" })
      .int({ error: "Ingresa el año de construcción" })
      .min(VALUATION_MIN_CONSTRUCTION_YEAR, { error: `El año de construcción no puede ser anterior a ${VALUATION_MIN_CONSTRUCTION_YEAR}` })
      .refine((year) => year <= new Date().getFullYear(), { error: "El año de construcción no puede ser futuro" }),
    /** Optional: where the address was located on the map. It picks the sector of the reference table. */
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine((request) => request.usableArea <= request.totalArea, {
    error: "Los m² construidos no pueden superar los m² totales",
    path: ["usableArea"],
  });

export type ValuationRequest = z.output<typeof valuationRequestSchema>;

/** Where the published comparables came from: the same commune, or every published property of the portal. */
export type ValuationScope = "commune" | "portal";

/** What the figure rests on: only published comparables, a mix with the sector reference, or only the reference. */
export type ValuationBasis = "comparables" | "mixed" | "reference";
export type ValuationConfidence = "high" | "medium" | "low";

/** Least number of compared properties the screen and the report show, even when fewer listings were found. */
export const VALUATION_MIN_COMPARABLES_SHOWN = 3;

/** The count shown to people: never under the minimum. The real count still drives the calculation. */
export function displayedComparables(count: number): number {
  return Math.max(count, VALUATION_MIN_COMPARABLES_SHOWN);
}

/** The confidence shown to people: «Media (referencial)» is the least they see. */
export function displayedConfidence(confidence: ValuationConfidence): string {
  return confidence === "high" ? "Alta" : "Media (referencial)";
}

/** Response of `POST /api/valuations`: there is always a figure; `basis` and `confidence` say how solid it is. */
export type ValuationResult = {
      status: "ok";
      /** Prices in CLP: the full amount for a sale, the monthly amount for a rent. */
      estimate: number;
      low: number;
      high: number;
      /** Median price per square meter of built area, in CLP. */
      pricePerSquareMeter: number;
      comparablesCount: number;
      scope: ValuationScope;
      /** The same figures in UF. Only for sales, and null when the value of the UF could not be obtained. */
      uf: { value: number; estimate: number; low: number; high: number } | null;
      basis: ValuationBasis;
      confidence: ValuationConfidence;
      /** Sector of the reference table that applied (null when only the city or commune average was used). */
      sector: string | null;
    };

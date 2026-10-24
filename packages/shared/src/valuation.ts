import { z } from "zod";
import { OPERATION_TYPES } from "./enums";
import { LEAD_ADDRESS_MAX_LENGTH, LEAD_COMMUNE_MAX_LENGTH } from "./lead";

/** Property types the price estimator covers. */
export const VALUATION_PROPERTY_TYPES = ["HOUSE", "APARTMENT"] as const;

/** Amenities that can refine the estimate, with the label shown in the form. */
export const VALUATION_AMENITIES = ["pool", "gym", "concierge", "garden", "heating", "heatedPool"] as const;
export type ValuationAmenity = (typeof VALUATION_AMENITIES)[number];
export const VALUATION_AMENITY_LABELS: Record<ValuationAmenity, string> = {
  pool: "Piscina",
  gym: "Gimnasio",
  concierge: "Conserjería",
  garden: "Jardín",
  heating: "Calefacción",
  heatedPool: "Piscina temperada",
};

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
  })
  .refine((request) => request.usableArea <= request.totalArea, {
    error: "Los m² construidos no pueden superar los m² totales",
    path: ["usableArea"],
  });

export type ValuationRequest = z.output<typeof valuationRequestSchema>;

/** Where the comparables came from: the same commune, or every published property of the portal. */
export type ValuationScope = "commune" | "portal";

/** Response of `POST /api/valuations`. `insufficient` means there is not enough data: no figure is invented. */
export type ValuationResult =
  | {
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
    }
  | { status: "insufficient" };

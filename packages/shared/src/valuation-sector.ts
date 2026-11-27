import { z } from "zod";

/** How a sector's numbers were obtained: a rough estimate, or a sample of real listings. */
export const VALUATION_SECTOR_SOURCES = ["estimado", "muestreo"] as const;
export type ValuationSectorSource = (typeof VALUATION_SECTOR_SOURCES)[number];

const ufPerSquareMeter = (label: string) =>
  z.number({ error: `Ingresa el valor UF/m² de ${label}` }).min(1, { error: "El valor mínimo es 1 UF/m²" }).max(500, { error: "El valor máximo es 500 UF/m²" });

/** Base price of a city, in UF per square meter. Every sector multiplies it by its coefficient. */
export const valuationCityBaseSchema = z.object({
  houseUfPerM2: ufPerSquareMeter("casa"),
  apartmentUfPerM2: ufPerSquareMeter("departamento"),
  landUfPerM2: ufPerSquareMeter("terreno"),
});

export const valuationCityCreateSchema = valuationCityBaseSchema.extend({
  name: z.string({ error: "Ingresa el nombre" }).trim().min(2, { error: "Ingresa el nombre" }).max(80, { error: "El nombre es demasiado largo" }),
});

export const VALUATION_COEFFICIENT_MIN = 0.3;
export const VALUATION_COEFFICIENT_MAX = 3;

export const valuationSectorFieldsSchema = z.object({
  name: z.string({ error: "Ingresa el nombre" }).trim().min(2, { error: "Ingresa el nombre" }).max(80, { error: "El nombre es demasiado largo" }),
  commune: z.string({ error: "Ingresa la comuna" }).trim().min(2, { error: "Ingresa la comuna" }).max(80, { error: "La comuna es demasiado larga" }),
  latitude: z.number({ error: "Ingresa la latitud" }).min(-90).max(90),
  longitude: z.number({ error: "Ingresa la longitud" }).min(-180).max(180),
  coefficient: z
    .number({ error: "Ingresa el coeficiente" })
    .min(VALUATION_COEFFICIENT_MIN, { error: `El coeficiente mínimo es ${VALUATION_COEFFICIENT_MIN}` })
    .max(VALUATION_COEFFICIENT_MAX, { error: `El coeficiente máximo es ${VALUATION_COEFFICIENT_MAX}` }),
  note: z.string().trim().max(300, { error: "La nota admite hasta 300 caracteres" }).default(""),
  source: z.enum(VALUATION_SECTOR_SOURCES, { error: "Fuente inválida" }),
});

export const valuationSectorCreateSchema = valuationSectorFieldsSchema.extend({ cityId: z.string().uuid({ error: "Ciudad inválida" }) });
export const valuationSectorUpdateSchema = valuationSectorFieldsSchema.partial();

export type ValuationCityBase = z.output<typeof valuationCityBaseSchema>;
export type ValuationCityCreate = z.output<typeof valuationCityCreateSchema>;
export type ValuationSectorCreate = z.output<typeof valuationSectorCreateSchema>;
export type ValuationSectorUpdate = z.output<typeof valuationSectorUpdateSchema>;

/** Response of `GET /api/admin/valuation-sectors`. */
export type ValuationSectorDto = {
  id: string;
  cityId: string;
  name: string;
  commune: string;
  latitude: number;
  longitude: number;
  coefficient: number;
  note: string;
  source: ValuationSectorSource;
  updatedAt: string;
};
export type ValuationCityDto = ValuationCityBase & { id: string; name: string; updatedAt: string; sectors: ValuationSectorDto[] };

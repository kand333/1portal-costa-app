import { z } from "zod";
import { CURRENCIES, OPERATION_TYPES, PROPERTY_TYPES } from "./enums";
import { MAX_FILTER_AMOUNT } from "./limits";
import type { PropertyDetail, PropertySummary } from "./property";
import { propertyListQuerySchema } from "./property-query";

export const PROPERTY_TITLE_MAX_LENGTH = 150;
export const PROPERTY_DESCRIPTION_MAX_LENGTH = 5000;
export const PROPERTY_LOCATION_MAX_LENGTH = 150;
export const FEATURE_NAME_MAX_LENGTH = 60;
export const MAX_FEATURES_PER_PROPERTY = 30;
/** Database column Decimal(10, 2). */
export const MAX_AREA = 99_999_999.99;
export const MAX_ROOMS = 50;
export const MAX_AGE_IN_YEARS = 300;

const requiredText = (label: string, min: number, max: number) =>
  z
    .string({ error: `Ingresa ${label}` })
    .trim()
    .min(min, { error: `Ingresa ${label}` })
    .max(max, { error: `Máximo ${max} caracteres` });

/** Optional count: null when it does not apply (e.g. bedrooms of a plot of land). */
const optionalCount = (max: number) =>
  z.number({ error: "Ingresa un número entero" }).int({ error: "Ingresa un número entero" }).min(0, { error: "No puede ser negativo" }).max(max, { error: `Máximo ${max}` }).nullable().default(null);

const optionalArea = z
  .number({ error: "Ingresa una superficie válida" })
  .positive({ error: "La superficie debe ser mayor que 0" })
  .max(MAX_AREA, { error: "La superficie es demasiado grande" })
  .nullable()
  .default(null);

/** Feature names: trimmed, without empty ones, and without repeating a name in another case. */
const featureNamesSchema = z
  .array(z.string().trim().max(FEATURE_NAME_MAX_LENGTH, { error: `Cada característica admite hasta ${FEATURE_NAME_MAX_LENGTH} caracteres` }))
  .default([])
  .transform((names) => {
    const unique = new Map<string, string>();
    for (const name of names) if (name && !unique.has(name.toLocaleLowerCase("es"))) unique.set(name.toLocaleLowerCase("es"), name);
    return [...unique.values()];
  })
  .refine((names) => names.length <= MAX_FEATURES_PER_PROPERTY, {
    error: `Máximo ${MAX_FEATURES_PER_PROPERTY} características`,
  });

/**
 * Body of `POST /api/admin/properties` and `PUT /api/admin/properties/{id}` (full replacement).
 * No coordinates: the map is built from the address.
 */
export const propertyInputSchema = z.object({
  title: requiredText("un título", 3, PROPERTY_TITLE_MAX_LENGTH),
  description: requiredText("una descripción", 10, PROPERTY_DESCRIPTION_MAX_LENGTH),
  operationType: z.enum(OPERATION_TYPES, { error: "Elige venta o arriendo" }),
  propertyType: z.enum(PROPERTY_TYPES, { error: "Elige un tipo de propiedad" }),
  price: z
    .number({ error: "Ingresa un precio válido" })
    .positive({ error: "El precio debe ser mayor que 0" })
    .max(MAX_FILTER_AMOUNT, { error: "El precio es demasiado alto" }),
  currency: z.enum(CURRENCIES).default("CLP"),
  usableArea: optionalArea,
  totalArea: optionalArea,
  bedrooms: optionalCount(MAX_ROOMS),
  bathrooms: optionalCount(MAX_ROOMS),
  parkingSpaces: optionalCount(MAX_ROOMS),
  ageInYears: optionalCount(MAX_AGE_IN_YEARS),
  address: requiredText("la dirección", 3, PROPERTY_LOCATION_MAX_LENGTH),
  commune: requiredText("la comuna", 2, PROPERTY_LOCATION_MAX_LENGTH),
  city: requiredText("la ciudad", 2, PROPERTY_LOCATION_MAX_LENGTH),
  region: requiredText("la región", 2, PROPERTY_LOCATION_MAX_LENGTH),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  features: featureNamesSchema,
});

export type PropertyInput = z.input<typeof propertyInputSchema>;
export type PropertyInputData = z.output<typeof propertyInputSchema>;

/** `active`: not deleted (published or not). `deleted`: soft-deleted, newest deletion first. */
/**
 * `active`: not deleted (published or not, the default). `published` / `draft`: active and published
 * or not. `deleted`: soft-deleted, newest deletion first.
 */
export const ADMIN_PROPERTY_STATUSES = ["active", "published", "draft", "deleted"] as const;
export type AdminPropertyStatus = (typeof ADMIN_PROPERTY_STATUSES)[number];

// An empty query value (e.g. "?status=") means the filter is not used.
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);
const optionalDay = z.preprocess(emptyToUndefined, z.iso.date({ error: "Ingresa una fecha válida" }).optional());

/**
 * Query of `GET /api/admin/properties`: page, free-text search and filters that all combine (AND).
 * Same names as the public catalog for the shared ones; `createdFrom`/`createdTo` are days (YYYY-MM-DD).
 */
export const adminPropertyListQuerySchema = z
  .object({
    page: propertyListQuerySchema.shape.page,
    pageSize: propertyListQuerySchema.shape.pageSize,
    search: propertyListQuerySchema.shape.search,
    status: z.preprocess(
      emptyToUndefined,
      z.enum(ADMIN_PROPERTY_STATUSES, { error: "Estado de propiedad inválido" }).default("active"),
    ),
    operation: propertyListQuerySchema.shape.operation,
    type: propertyListQuerySchema.shape.type,
    minPrice: propertyListQuerySchema.shape.minPrice,
    maxPrice: propertyListQuerySchema.shape.maxPrice,
    city: propertyListQuerySchema.shape.city,
    createdFrom: optionalDay,
    createdTo: optionalDay,
  })
  .refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    message: "El precio mínimo no puede ser mayor que el máximo",
    path: ["maxPrice"],
  })
  .refine((query) => !query.createdFrom || !query.createdTo || query.createdFrom <= query.createdTo, {
    message: "La fecha inicial no puede ser posterior a la final",
    path: ["createdTo"],
  });
export type AdminPropertyListQuery = z.output<typeof adminPropertyListQuerySchema>;

/** A row of the admin list: the public card data plus its publication state and deletion date. */
export type AdminPropertySummary = PropertySummary & { isPublished: boolean; updatedAt: string; deletedAt: string | null };

/** A property as the admin edits it (published or not). */
export type AdminPropertyDetail = PropertyDetail & { isPublished: boolean };

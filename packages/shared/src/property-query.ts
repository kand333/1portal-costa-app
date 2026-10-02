import { z } from "zod";
import { OPERATION_TYPES, PROPERTY_SORTS, PROPERTY_TYPES } from "./enums";
import {
  DEFAULT_PAGE_SIZE,
  LOCATION_SLUG_PATTERN,
  MAX_FILTER_AMOUNT,
  MAX_LOCATION_SLUG_LENGTH,
  MAX_LOCATIONS_PER_FILTER,
  MAX_PAGE_SIZE,
  MAX_ROOMS_FILTER,
  MAX_SEARCH_LENGTH,
} from "./limits";

// Query parameters come as strings; an empty value (e.g. "?type=") means the filter is not used.
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const optionalEnum = <Values extends readonly [string, ...string[]]>(values: Values) =>
  z.preprocess(emptyToUndefined, z.enum(values).optional());

const optionalAmount = z.preprocess(
  emptyToUndefined,
  z.coerce.number().finite().nonnegative().max(MAX_FILTER_AMOUNT).optional(),
);

const optionalRooms = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(MAX_ROOMS_FILTER).optional());

// One or several location slugs (`?commune=las-condes&commune=providencia`): any of them matches.
// Empty values are dropped; no value at all means the filter is not used.
const optionalLocationSlugs = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    const slugs = [value].flat().filter((slug) => emptyToUndefined(slug) !== undefined);
    return slugs.length > 0 ? slugs : undefined;
  },
  z
    .array(z.string().trim().toLowerCase().max(MAX_LOCATION_SLUG_LENGTH).regex(LOCATION_SLUG_PATTERN))
    .max(MAX_LOCATIONS_PER_FILTER)
    .transform((slugs) => [...new Set(slugs)])
    .optional(),
);

export const propertyListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    featured: z.stringbool().optional(),
    // Free text over title, commune, city, region and description. An empty value means "no search".
    search: z
      .string()
      .trim()
      .max(MAX_SEARCH_LENGTH)
      .transform((value) => value || undefined)
      .optional(),
    operation: optionalEnum(OPERATION_TYPES),
    // Absent means the default order (newest first).
    sort: optionalEnum(PROPERTY_SORTS),
    type: optionalEnum(PROPERTY_TYPES),
    minPrice: optionalAmount,
    maxPrice: optionalAmount,
    /** Minimum number of bedrooms ("3" means 3 or more). */
    bedrooms: optionalRooms,
    /** Minimum number of bathrooms. */
    bathrooms: optionalRooms,
    minUsableArea: optionalAmount,
    commune: optionalLocationSlugs,
    city: optionalLocationSlugs,
    region: optionalLocationSlugs,
  })
  .refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    message: "El precio mínimo no puede ser mayor que el máximo",
    path: ["maxPrice"],
  });

export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;

export const propertyIdSchema = z.uuid();

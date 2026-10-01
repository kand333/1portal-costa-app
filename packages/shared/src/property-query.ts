import { z } from "zod";
import { OPERATION_TYPES } from "./enums";

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export const propertyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  operation: z.enum(OPERATION_TYPES).optional(),
  featured: z.stringbool().optional(),
});

export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;

export const propertyIdSchema = z.uuid();

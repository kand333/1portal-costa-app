import { z } from "zod";
import { LEAD_KINDS, OPERATION_TYPES, PROPERTY_TYPES } from "./enums";
import { propertyListQuerySchema } from "./property-query";
import { INQUIRY_EMAIL_MAX_LENGTH, INQUIRY_MESSAGE_MAX_LENGTH, INQUIRY_NAME_MAX_LENGTH, INQUIRY_PHONE_MAX_LENGTH } from "./inquiry";

export const LEAD_ADDRESS_MAX_LENGTH = 200;
export const LEAD_COMMUNE_MAX_LENGTH = 100;

/** Forms that capture leads (home page and valuation page); stored in `Lead.source`. */
export const LEAD_SOURCES = ["home-hero", "home-closing", "tasador"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Digits with optional "+", spaces, dots, hyphens and parentheses, e.g. "+56 9 1234 5678". */
const PHONE_PATTERN = /^\+?[0-9 ().-]{7,}$/;

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const optionalText = (maxLength: number, tooLongMessage: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(maxLength, { error: tooLongMessage }).optional());

/**
 * Body of `POST /api/leads`. The same rules validate the forms in the browser.
 * `website` is a honeypot: people leave it empty, bots fill it in.
 */
export const leadCreateSchema = z
  .object({
    kind: z.enum(LEAD_KINDS, { error: "Tipo de solicitud inválido" }),
    source: z.enum(LEAD_SOURCES, { error: "Origen inválido" }),
    name: z
      .string({ error: "Ingresa tu nombre" })
      .trim()
      .min(2, { error: "Ingresa tu nombre" })
      .max(INQUIRY_NAME_MAX_LENGTH, { error: `El nombre admite hasta ${INQUIRY_NAME_MAX_LENGTH} caracteres` }),
    email: z
      .string({ error: "Ingresa tu email" })
      .trim()
      .max(INQUIRY_EMAIL_MAX_LENGTH, { error: "El email es demasiado largo" })
      .pipe(z.email({ error: "Ingresa un email válido, por ejemplo nombre@correo.cl" })),
    phone: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(INQUIRY_PHONE_MAX_LENGTH, { error: "El teléfono es demasiado largo" })
        .regex(PHONE_PATTERN, { error: "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678" })
        .optional(),
    ),
    address: optionalText(LEAD_ADDRESS_MAX_LENGTH, `La dirección admite hasta ${LEAD_ADDRESS_MAX_LENGTH} caracteres`),
    commune: optionalText(LEAD_COMMUNE_MAX_LENGTH, `La comuna admite hasta ${LEAD_COMMUNE_MAX_LENGTH} caracteres`),
    operation: z.preprocess(emptyToUndefined, z.enum(OPERATION_TYPES, { error: "Operación inválida" }).optional()),
    propertyType: z.preprocess(emptyToUndefined, z.enum(PROPERTY_TYPES, { error: "Tipo de propiedad inválido" }).optional()),
    message: optionalText(INQUIRY_MESSAGE_MAX_LENGTH, `El mensaje admite hasta ${INQUIRY_MESSAGE_MAX_LENGTH} caracteres`),
    website: z.string().optional(),
  })
  .refine((lead) => lead.kind !== "VALUATION" || Boolean(lead.address), {
    error: "Ingresa la dirección o el sector de la propiedad",
    path: ["address"],
  });

export type LeadCreateInput = z.input<typeof leadCreateSchema>;
export type LeadCreateData = z.output<typeof leadCreateSchema>;

/** Response of `POST /api/leads` (201). */
export type LeadCreated = {
  id: string;
  kind: (typeof LEAD_KINDS)[number];
  createdAt: string;
};

/** Query of `GET /api/admin/leads`. */
export const adminLeadListQuerySchema = z.object({
  page: propertyListQuerySchema.shape.page,
  pageSize: propertyListQuerySchema.shape.pageSize,
});
export type AdminLeadListQuery = z.output<typeof adminLeadListQuerySchema>;

/** A row of `GET /api/admin/leads`, newest first. */
export type AdminLeadSummary = {
  id: string;
  kind: (typeof LEAD_KINDS)[number];
  source: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  commune: string | null;
  operation: (typeof OPERATION_TYPES)[number] | null;
  propertyType: (typeof PROPERTY_TYPES)[number] | null;
  /** Registered user who sent it, or null for a visitor. */
  user: { id: string; name: string } | null;
  createdAt: string;
};

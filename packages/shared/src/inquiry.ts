import { z } from "zod";

export const INQUIRY_NAME_MAX_LENGTH = 100;
export const INQUIRY_EMAIL_MAX_LENGTH = 254;
export const INQUIRY_PHONE_MAX_LENGTH = 30;
export const INQUIRY_MESSAGE_MIN_LENGTH = 10;
export const INQUIRY_MESSAGE_MAX_LENGTH = 2000;

/** Digits with optional "+", spaces, dots, hyphens and parentheses, e.g. "+56 9 1234 5678". */
const PHONE_PATTERN = /^\+?[0-9 ().-]{7,}$/;

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/** Body of `POST /api/inquiries`. The same rules validate the form in the browser. */
export const inquiryCreateSchema = z.object({
  propertyId: z.uuid({ error: "Propiedad inválida" }),
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
  message: z
    .string({ error: "Escribe tu mensaje" })
    .trim()
    .min(INQUIRY_MESSAGE_MIN_LENGTH, {
      error: `El mensaje debe tener al menos ${INQUIRY_MESSAGE_MIN_LENGTH} caracteres`,
    })
    .max(INQUIRY_MESSAGE_MAX_LENGTH, {
      error: `El mensaje admite hasta ${INQUIRY_MESSAGE_MAX_LENGTH} caracteres`,
    }),
});

export type InquiryCreateInput = z.input<typeof inquiryCreateSchema>;
export type InquiryCreateData = z.output<typeof inquiryCreateSchema>;

/** Response of `POST /api/inquiries` (201): the stored inquiry. */
export type InquiryCreated = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  createdAt: string;
};

import { z } from "zod";
import type { PropertySummary } from "./property";
import { propertyListQuerySchema } from "./property-query";

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

/** Latest entry of the conversation that follows an inquiry (a preview for the lists). */
export type InquiryLastMessage = { fromAdmin: boolean; body: string; createdAt: string };

/** An inquiry of the logged-in user (`GET /api/account/inquiries`), latest activity first. */
export type UserInquiry = {
  id: string;
  /** Null when the property was deleted. */
  propertyId: string | null;
  /** Title when the inquiry was sent. */
  propertyTitle: string;
  message: string;
  createdAt: string;
  /** Current card data, or null when the property is no longer published. */
  property: PropertySummary | null;
  /** Replies from the portal in the conversation. */
  adminReplyCount: number;
  /** Creation or latest message, from either side. */
  lastActivityAt: string;
  /** Null while nobody has answered. */
  lastMessage: InquiryLastMessage | null;
};

/** One message of the conversation that follows an inquiry. */
export type InquiryMessage = {
  id: string;
  fromAdmin: boolean;
  /** Null once the author account was deleted. */
  authorName: string | null;
  body: string;
  createdAt: string;
};

/** `GET /api/account/inquiries/{id}`: one of the user's inquiries with its conversation, oldest first. */
export type UserInquiryDetail = UserInquiry & { messages: InquiryMessage[] };

/** Body of a reply, from ADMIN or from the user (`POST …/inquiries/{id}/messages`). */
export const inquiryReplySchema = z.object({
  body: z
    .string({ error: "Escribe tu respuesta" })
    .trim()
    .min(1, { error: "Escribe tu respuesta" })
    .max(INQUIRY_MESSAGE_MAX_LENGTH, { error: `La respuesta admite hasta ${INQUIRY_MESSAGE_MAX_LENGTH} caracteres` }),
});
export type InquiryReplyData = z.output<typeof inquiryReplySchema>;

/** Query of `GET /api/admin/inquiries`: page and free text over property title, name, email and message. */
export const adminInquiryListQuerySchema = z.object({
  page: propertyListQuerySchema.shape.page,
  pageSize: propertyListQuerySchema.shape.pageSize,
  search: propertyListQuerySchema.shape.search,
});
export type AdminInquiryListQuery = z.output<typeof adminInquiryListQuerySchema>;

/** A row of `GET /api/admin/inquiries`, latest activity first. */
export type AdminInquirySummary = {
  id: string;
  propertyId: string | null;
  /** Title when the inquiry was sent. */
  propertyTitle: string;
  /** The property can be opened on the public site (published and not deleted). */
  isPropertyPublic: boolean;
  /** Registered user who sent it, or null for a visitor. */
  user: { id: string; name: string; email: string } | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  /** The user removed it from their account. */
  hiddenByUser: boolean;
  /** Replies after the inquiry, from either side. */
  messageCount: number;
  lastActivityAt: string;
  /** Null while nobody has answered. */
  lastMessage: InquiryLastMessage | null;
  /** The last word is the user's: it is waiting for an answer. */
  awaitingReply: boolean;
};

/** `GET /api/admin/inquiries/{id}`: the inquiry with its conversation, oldest first. */
export type AdminInquiryDetail = AdminInquirySummary & { messages: InquiryMessage[] };

/** Id of an inquiry in `DELETE /api/account/inquiries/{id}`. */
export const inquiryIdSchema = z.uuid();

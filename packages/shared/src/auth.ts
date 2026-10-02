import { z } from "zod";
import type { UserRole } from "./enums";

export const USER_NAME_MAX_LENGTH = 100;
export const USER_EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
/** Upper bound so a huge password cannot make the hashing (scrypt) expensive. */
export const PASSWORD_MAX_LENGTH = 128;

/** Emails are compared and stored trimmed and lowercase. */
const emailSchema = z
  .string({ error: "Ingresa tu email" })
  .trim()
  .toLowerCase()
  .max(USER_EMAIL_MAX_LENGTH, { error: "El email es demasiado largo" })
  .pipe(z.email({ error: "Ingresa un email válido, por ejemplo nombre@correo.cl" }));

/** Body of `POST /api/auth/register`. */
export const registerSchema = z.object({
  name: z
    .string({ error: "Ingresa tu nombre" })
    .trim()
    .min(2, { error: "Ingresa tu nombre" })
    .max(USER_NAME_MAX_LENGTH, { error: `El nombre admite hasta ${USER_NAME_MAX_LENGTH} caracteres` }),
  email: emailSchema,
  // Not trimmed: spaces are valid characters of a password.
  password: z
    .string({ error: "Ingresa una contraseña" })
    .min(PASSWORD_MIN_LENGTH, { error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` })
    .max(PASSWORD_MAX_LENGTH, { error: `La contraseña admite hasta ${PASSWORD_MAX_LENGTH} caracteres` }),
});

/** Body of `POST /api/auth/login`. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Ingresa tu contraseña" })
    .min(1, { error: "Ingresa tu contraseña" })
    .max(PASSWORD_MAX_LENGTH, { error: "Email o contraseña incorrectos" }),
});

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;

/** The authenticated user, as returned by the auth endpoints. Never includes the password hash. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Always true in a successful response: deactivated accounts cannot log in or keep a session. */
  isActive: boolean;
};

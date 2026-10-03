import { describe, expect, it } from "vitest";
import { adminInquiryListQuerySchema, INQUIRY_MESSAGE_MAX_LENGTH, inquiryCreateSchema, inquiryReplySchema } from "./inquiry";

const validInput = {
  propertyId: "5eed0000-0000-4000-8000-000000000001",
  name: "  María Pérez ",
  email: " maria@correo.cl ",
  phone: "+56 9 1234 5678",
  message: "Me interesa visitar la propiedad este fin de semana.",
};

const firstError = (input: Record<string, unknown>) => {
  const result = inquiryCreateSchema.safeParse(input);
  return result.success ? null : { path: result.error.issues[0].path.join("."), message: result.error.issues[0].message };
};

describe("inquiryCreateSchema", () => {
  it("accepts a complete inquiry and trims its texts", () => {
    expect(inquiryCreateSchema.parse(validInput)).toEqual({
      ...validInput,
      name: "María Pérez",
      email: "maria@correo.cl",
    });
  });

  it("treats the phone as optional, also when it is empty", () => {
    expect(inquiryCreateSchema.parse({ ...validInput, phone: undefined }).phone).toBeUndefined();
    expect(inquiryCreateSchema.parse({ ...validInput, phone: "  " }).phone).toBeUndefined();
  });

  it.each([
    [{ propertyId: "not-a-uuid" }, "propertyId", "Propiedad inválida"],
    [{ name: " " }, "name", "Ingresa tu nombre"],
    [{ name: "x".repeat(101) }, "name", "El nombre admite hasta 100 caracteres"],
    [{ email: "maria@" }, "email", "Ingresa un email válido, por ejemplo nombre@correo.cl"],
    [{ phone: "abc" }, "phone", "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678"],
    [{ phone: "12" }, "phone", "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678"],
    [{ message: "Hola" }, "message", "El mensaje debe tener al menos 10 caracteres"],
    [{ message: "x".repeat(2001) }, "message", "El mensaje admite hasta 2000 caracteres"],
  ])("rejects %o with a message in Spanish", (override, path, message) => {
    expect(firstError({ ...validInput, ...override })).toEqual({ path, message });
  });

  it("rejects missing required fields", () => {
    const result = inquiryCreateSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["propertyId", "name", "email", "message"]);
    }
  });
});

describe("inquiryReplySchema", () => {
  it("trims the reply", () => {
    expect(inquiryReplySchema.parse({ body: "  Hola, sí está disponible.  " })).toEqual({ body: "Hola, sí está disponible." });
  });

  it.each([
    [{ body: "   " }, "Escribe tu respuesta"],
    [{}, "Escribe tu respuesta"],
    [{ body: "a".repeat(INQUIRY_MESSAGE_MAX_LENGTH + 1) }, `La respuesta admite hasta ${INQUIRY_MESSAGE_MAX_LENGTH} caracteres`],
  ])("rejects %o", (input, message) => {
    const result = inquiryReplySchema.safeParse(input);
    expect(result.success ? null : result.error.issues[0].message).toBe(message);
  });
});

describe("adminInquiryListQuerySchema", () => {
  it("reads page, page size and search only", () => {
    expect(adminInquiryListQuerySchema.parse({ page: "2", search: "casa", status: "x" })).toEqual({ page: 2, pageSize: 12, search: "casa" });
  });
});

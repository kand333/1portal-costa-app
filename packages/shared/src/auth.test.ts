import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? null : result.error?.issues[0]?.message;

describe("registerSchema", () => {
  const valid = { name: "  Ana Rojas ", email: " Ana@Correo.CL ", password: "clave segura 1" };

  it("accepts a valid account, trimming the name and normalizing the email", () => {
    expect(registerSchema.parse(valid)).toEqual({
      name: "Ana Rojas",
      email: "ana@correo.cl",
      password: "clave segura 1",
    });
  });

  it("keeps the password exactly as typed, spaces included", () => {
    expect(registerSchema.parse({ ...valid, password: " espacios " }).password).toBe(" espacios ");
  });

  it.each([
    [{ name: " " }, "Ingresa tu nombre"],
    [{ email: "ana@" }, "Ingresa un email válido, por ejemplo nombre@correo.cl"],
    [{ password: "corta" }, "La contraseña debe tener al menos 8 caracteres"],
    [{ password: "x".repeat(129) }, "La contraseña admite hasta 128 caracteres"],
  ])("rejects %o", (override, message) => {
    expect(firstMessage(registerSchema.safeParse({ ...valid, ...override }))).toBe(message);
  });
});

describe("loginSchema", () => {
  it("normalizes the email and accepts any non-empty password", () => {
    expect(loginSchema.parse({ email: " ANA@correo.cl", password: "x" })).toEqual({
      email: "ana@correo.cl",
      password: "x",
    });
  });

  it("asks for the password when it is empty", () => {
    expect(firstMessage(loginSchema.safeParse({ email: "ana@correo.cl", password: "" }))).toBe(
      "Ingresa tu contraseña",
    );
  });
});

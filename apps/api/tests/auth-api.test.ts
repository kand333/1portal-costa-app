import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import type { AuthUser } from "@portal/shared/auth";

// Integration test: calls the real Route Handlers against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const baseUrl = "http://localhost:3000/api/auth";
const emailFor = (label: string) => `${label}-${testRunId}@test.cl`;

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const jsonRequest = (path: string, body: unknown) =>
  new Request(`${baseUrl}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** Value of the session cookie set by a response ("" when it is cleared). */
function sessionCookie(response: Response): { value: string; attributes: string } | null {
  const header = response.headers.get("set-cookie");
  const match = header?.match(/portal_session=([^;]*);?(.*)/);
  return match ? { value: match[1], attributes: match[2] } : null;
}

async function register(body: unknown) {
  const { POST } = await import("@/app/api/auth/register/route");
  return POST(jsonRequest("register", body));
}

async function login(body: unknown) {
  const { POST } = await import("@/app/api/auth/login/route");
  return POST(jsonRequest("login", body));
}

async function me(cookieValue?: string) {
  const { GET } = await import("@/app/api/auth/me/route");
  const headers = cookieValue === undefined ? undefined : { cookie: `portal_session=${cookieValue}` };
  return GET(new NextRequest(`${baseUrl}/me`, { headers }));
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("auth API", () => {
  const password = "clave segura 1";

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("registers a USER, hashes the password and starts a session", async () => {
    const response = await register({ name: "Ana Rojas", email: ` ${emailFor("Ana").toUpperCase()} `, password });

    expect(response.status).toBe(201);
    const user = (await response.json()) as AuthUser;
    expect(user).toEqual({
      id: expect.any(String),
      name: "Ana Rojas",
      email: emailFor("ana"),
      role: "USER",
      isActive: true,
    });
    expect(JSON.stringify(user)).not.toContain("password");

    const cookie = sessionCookie(response);
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.attributes).toMatch(/HttpOnly/i);
    expect(cookie?.attributes).toMatch(/SameSite=lax/i);
    expect(cookie?.attributes).toMatch(/Path=\//i);

    const prisma = await getPrisma();
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).toMatch(/^scrypt\$/);
    expect(stored.passwordHash).not.toContain(password);
  });

  it("returns 409 when the email already has an account", async () => {
    await register({ name: "Primera", email: emailFor("duplicated"), password });
    const response = await register({ name: "Segunda", email: emailFor("DUPLICATED"), password });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Ya existe una cuenta con este email", status: 409 });
  });

  it("returns 400 with the validation message for invalid data", async () => {
    const response = await register({ name: "Ana", email: emailFor("short"), password: "corta" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "La contraseña debe tener al menos 8 caracteres", status: 400 });
  });

  it("logs in with the right password and reads the current user from the cookie", async () => {
    await register({ name: "Luis", email: emailFor("luis"), password });

    const response = await login({ email: emailFor("LUIS"), password });
    expect(response.status).toBe(200);
    const cookie = sessionCookie(response);

    const current = await me(cookie?.value);
    expect(current.status).toBe(200);
    expect(await current.json()).toMatchObject({ email: emailFor("luis"), name: "Luis", role: "USER", isActive: true });
  });

  it("uses the same 401 message for a wrong password and an unknown email", async () => {
    await register({ name: "Eva", email: emailFor("eva"), password });

    for (const credentials of [
      { email: emailFor("eva"), password: "otra clave" },
      { email: emailFor("nobody"), password },
    ]) {
      const response = await login(credentials);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: "Email o contraseña incorrectos", status: 401 });
      expect(sessionCookie(response)).toBeNull();
    }
  });

  it("does not let a deactivated user log in or keep a session", async () => {
    const registered = await register({ name: "Inactivo", email: emailFor("inactive"), password });
    const { id } = (await registered.json()) as AuthUser;
    const oldSession = sessionCookie(registered)?.value;
    const prisma = await getPrisma();
    await prisma.user.update({ where: { id }, data: { isActive: false } });

    const response = await login({ email: emailFor("inactive"), password });
    expect(response.status).toBe(403);
    expect(sessionCookie(response)).toBeNull();

    const current = await me(oldSession);
    expect(current.status).toBe(401);
    expect(sessionCookie(current)?.value).toBe("");
  });

  it("answers 401 to me without a session or with a forged cookie", async () => {
    expect((await me()).status).toBe(401);
    expect((await me("forged.token")).status).toBe(401);
  });

  it("logs out by clearing the cookie", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const response = await POST(new NextRequest(`${baseUrl}/logout`, { method: "POST" }));
    expect(response.status).toBe(204);
    const cookie = sessionCookie(response);
    expect(cookie?.value).toBe("");
    expect(cookie?.attributes).toMatch(/Max-Age=0/i);
  });

  // 11 scrypt checks (~0.4 s each, by design) need more than the default 5 s.
  it("blocks login for a while after 10 failed attempts", { timeout: 30_000 }, async () => {
    await register({ name: "Bloqueo", email: emailFor("blocked"), password });
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await login({ email: emailFor("blocked"), password: "incorrecta" });
    }
    const response = await login({ email: emailFor("blocked"), password });
    expect(response.status).toBe(429);
  });
});

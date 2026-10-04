import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Integration test: the account endpoints against the test database, with a real session cookie.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const emailFor = (label: string) => `${label}-${testRunId}@test.cl`;
const password = "clave actual 1";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function createUser(label: string) {
  const prisma = await getPrisma();
  const { hashPassword } = await import("@/lib/auth/password");
  const user = await prisma.user.create({
    data: { name: label, email: emailFor(label), passwordHash: await hashPassword(password) },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return { id: user.id, cookie: `portal_session=${createSessionToken(user.id)}` };
}

function jsonRequest(path: string, method: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost:3000/api/account/${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function patchProfile(body: unknown, cookie?: string) {
  const { PATCH } = await import("@/app/api/account/profile/route");
  const response = await PATCH(jsonRequest("profile", "PATCH", body, cookie));
  return { status: response.status, body: await response.json() };
}

async function putPassword(body: unknown, cookie?: string) {
  const { PUT } = await import("@/app/api/account/password/route");
  const response = await PUT(jsonRequest("password", "PUT", body, cookie));
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("account API", () => {
  let session: { id: string; cookie: string };

  beforeAll(async () => {
    session = await createUser("owner");
    await createUser("taken");
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("requires a session", async () => {
    expect((await patchProfile({ name: "X Y", email: emailFor("x") })).status).toBe(401);
    expect((await putPassword({ currentPassword: password, newPassword: "otra clave 2" })).status).toBe(401);
  });

  it("updates the name without asking for the password when the email stays", async () => {
    const result = await patchProfile({ name: "Nombre Nuevo", email: emailFor("owner") }, session.cookie);
    expect(result).toEqual({
      status: 200,
      body: { id: session.id, name: "Nombre Nuevo", email: emailFor("owner"), role: "USER", isActive: true },
    });
  });

  it("asks for the right current password to change the email", { timeout: 20_000 }, async () => {
    const newEmail = emailFor("renamed");
    const wrong = { status: 400, body: { message: "La contraseña actual no es correcta", status: 400 } };

    expect(await patchProfile({ name: "Nombre Nuevo", email: newEmail }, session.cookie)).toEqual(wrong);
    expect(await patchProfile({ name: "Nombre Nuevo", email: newEmail, currentPassword: "mala" }, session.cookie)).toEqual(
      wrong,
    );

    const changed = await patchProfile(
      { name: "Nombre Nuevo", email: ` ${newEmail.toUpperCase()} `, currentPassword: password },
      session.cookie,
    );
    expect(changed.status).toBe(200);
    expect(changed.body.email).toBe(newEmail);
  });

  it("returns 409 when the new email belongs to another account", { timeout: 20_000 }, async () => {
    const result = await patchProfile(
      { name: "Nombre Nuevo", email: emailFor("taken"), currentPassword: password },
      session.cookie,
    );
    expect(result).toEqual({ status: 409, body: { message: "Ya existe una cuenta con este email", status: 409 } });
  });

  it("changes the password only with the right current one", { timeout: 30_000 }, async () => {
    expect(await putPassword({ currentPassword: "mala clave", newPassword: "nueva clave 2" }, session.cookie)).toEqual({
      status: 400,
      body: { message: "La contraseña actual no es correcta", status: 400 },
    });
    expect((await putPassword({ currentPassword: password, newPassword: "corta" }, session.cookie)).status).toBe(400);

    expect(await putPassword({ currentPassword: password, newPassword: "nueva clave 2" }, session.cookie)).toEqual({
      status: 204,
      body: null,
    });

    const prisma = await getPrisma();
    const { verifyPassword } = await import("@/lib/auth/password");
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
    await expect(verifyPassword("nueva clave 2", stored.passwordHash)).resolves.toBe(true);
    await expect(verifyPassword(password, stored.passwordHash)).resolves.toBe(false);
  });
});

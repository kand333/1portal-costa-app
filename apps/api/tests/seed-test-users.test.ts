import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";
import { seedTestUsers, TEST_USER_PASSWORD, testUsers } from "../prisma/seed/test-users";
import { verifyPassword } from "@/lib/auth/password";

// Integration test: runs the test-users seed against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const emails = testUsers.map((user) => user.email);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

describe.skipIf(!hasDatabaseUrl)("test users seed", () => {
  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await prisma.$disconnect();
  });

  it("creates the USER and ADMIN accounts and a deactivated one, all with the test password", { timeout: 30_000 }, async () => {
    const prisma = await getPrisma();
    await seedTestUsers(prisma);

    const users = await prisma.user.findMany({ where: { email: { in: emails } }, orderBy: { email: "asc" } });
    expect(users.map(({ name, email, role, isActive }) => ({ name, email, role, isActive }))).toEqual([
      { name: "Admin Portal", email: "admin@test.com", role: "ADMIN", isActive: true },
      { name: "Ana García", email: "ana@test.com", role: "USER", isActive: true },
      { name: "Marta Inactiva", email: "inactiva@test.com", role: "USER", isActive: false },
      { name: "Luis Pérez", email: "luis@test.com", role: "USER", isActive: true },
    ]);
    for (const user of users) {
      expect(user.passwordHash).toMatch(/^scrypt\$131072\$8\$1\$/);
      await expect(verifyPassword(TEST_USER_PASSWORD, user.passwordHash)).resolves.toBe(true);
    }
  });

  it("is idempotent and restores a changed account", { timeout: 30_000 }, async () => {
    const prisma = await getPrisma();
    await seedTestUsers(prisma);
    await prisma.user.update({ where: { email: "ana@test.com" }, data: { isActive: false, passwordHash: "x" } });

    await seedTestUsers(prisma);

    expect(await prisma.user.count({ where: { email: { in: emails } } })).toBe(4);
    const ana = await prisma.user.findUniqueOrThrow({ where: { email: "ana@test.com" } });
    expect(ana.isActive).toBe(true);
    await expect(verifyPassword(TEST_USER_PASSWORD, ana.passwordHash)).resolves.toBe(true);
  });
});

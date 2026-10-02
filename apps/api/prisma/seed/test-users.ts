import type { PrismaClient } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/auth/password";

/** Test accounts for local development and manual QA. Never for production. */
export const TEST_USER_PASSWORD = "test1234";

export const testUsers = [
  { name: "Ana García", email: "ana@test.com", role: "USER", isActive: true },
  { name: "Luis Pérez", email: "luis@test.com", role: "USER", isActive: true },
  { name: "Admin Portal", email: "admin@test.com", role: "ADMIN", isActive: true },
  // Deactivated account: its login must be rejected (403).
  { name: "Marta Inactiva", email: "inactiva@test.com", role: "USER", isActive: false },
] as const;

/**
 * Creates or resets the test accounts (USER, ADMIN and one deactivated USER) with TEST_USER_PASSWORD,
 * hashed exactly as the registration does. Safe to re-run (upsert by email).
 */
export async function seedTestUsers(prisma: PrismaClient): Promise<number> {
  for (const user of testUsers) {
    const passwordHash = await hashPassword(TEST_USER_PASSWORD);
    const data = { name: user.name, passwordHash, role: user.role, isActive: user.isActive };
    await prisma.user.upsert({
      where: { email: user.email },
      update: data,
      create: { ...data, email: user.email },
    });
  }
  return testUsers.length;
}

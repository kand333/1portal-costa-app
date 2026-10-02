import "server-only";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const publicUserSelect = { id: true, name: true, email: true, role: true, isActive: true } as const;

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export function findUserById(id: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}

/** Includes the password hash: only for checking credentials. */
export function findUserCredentialsByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { ...publicUserSelect, passwordHash: true } });
}

export function insertUser(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
  return prisma.user.create({ data, select: publicUserSelect });
}

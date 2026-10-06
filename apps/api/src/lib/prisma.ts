import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseConnectionConfig } from "@/lib/database-config";
import { getRequiredEnvironmentVariable } from "@/lib/environment";

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(getDatabaseConnectionConfig(getRequiredEnvironmentVariable("DATABASE_URL")));
  return new PrismaClient({
    adapter,
    // The database is remote (Supabase): opening a new pooled connection (TLS + auth) can take
    // more than Prisma's default 2 s wait to start a transaction, which failed requests with P2028.
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  });
}

// Reuse a single client across hot reloads in development to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

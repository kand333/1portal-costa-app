import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getRequiredEnvironmentVariable } from "../src/lib/environment";
import { seedDatabase } from "./seed/seed-database";

// Entry point for `npm run db:seed` (development data only).
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed must not run in production.");
  }

  loadEnvConfig(process.cwd());
  const connectionString = getRequiredEnvironmentVariable("DATABASE_URL");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const summary = await seedDatabase(prisma);
    console.log(
      `Seed completed: ${summary.featureCount} features, ${summary.propertyCount} properties, ${summary.imageCount} images.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

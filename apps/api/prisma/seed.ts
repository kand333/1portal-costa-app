import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getRequiredEnvironmentVariable } from "../src/lib/environment";
import { seedDatabase } from "./seed/seed-database";
import { seedSnapshot } from "./seed/snapshot";
import { TEST_USER_PASSWORD } from "./seed/test-users";

// Entry point for `npm run db:seed` (development data only). It runs with the "react-server"
// condition (see prisma.config.ts) so the server-only password module can be imported.
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
      `Seed completed (snapshot of ${seedSnapshot.exportedAt}): ${summary.features} features, ${summary.users} users, ` +
        `${summary.properties} properties, ${summary.images} images, ${summary.favorites} favorites, ` +
        `${summary.inquiries} inquiries, ${summary.messages} messages.`,
    );

    const separator = "-".repeat(40);
    console.log(`Users (password for all: ${TEST_USER_PASSWORD}):`);
    for (const user of seedSnapshot.users) {
      console.log(separator);
      console.log(`name:     ${user.name}`);
      console.log(`email:    ${user.email}`);
      console.log(`role:     ${user.role}`);
      console.log(`isActive: ${user.isActive}`);
    }
    console.log(separator);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

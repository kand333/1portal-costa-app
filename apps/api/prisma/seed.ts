import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getRequiredEnvironmentVariable } from "../src/lib/environment";
import { seedDatabase } from "./seed/seed-database";
import { seedTestUsers, TEST_USER_PASSWORD, testUsers } from "./seed/test-users";

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
      `Seed completed: ${summary.featureCount} features, ${summary.propertyCount} properties, ${summary.imageCount} images.`,
    );

    const count = await seedTestUsers(prisma);

    // Print what is actually stored, in the order of the seed data.
    const seedOrder = new Map<string, number>(testUsers.map((user, index) => [user.email, index]));
    const storedUsers = await prisma.user.findMany({
      where: { email: { in: [...seedOrder.keys()] } },
      select: { name: true, email: true, role: true, isActive: true },
    });
    storedUsers.sort((first, second) => (seedOrder.get(first.email) ?? 0) - (seedOrder.get(second.email) ?? 0));

    const separator = "-".repeat(40);
    console.log(`Test users ready (${count}):`);
    for (const user of storedUsers) {
      console.log(separator);
      console.log(`name:     ${user.name}`);
      console.log(`email:    ${user.email}`);
      console.log(`pass:     ${TEST_USER_PASSWORD}`);
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

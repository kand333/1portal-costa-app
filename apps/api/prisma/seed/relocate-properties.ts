import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { getDatabaseConnectionConfig } from "../../src/lib/database-config";
import { LOCATION_ONLY, RELOCATIONS, type Relocation } from "./relocation-data";

/**
 * Moves the sample properties to the Biobío: location from the catalog filters, new title and
 * description, local prices and complete details, and a coherent set of features (see relocation-data.ts).
 * Rows are matched by id; images, favorites, inquiries and users are not touched.
 *
 * Run from apps/api. It never reads DATABASE_URL, so it cannot hit a real database by accident:
 *   RELOCATE_DATABASE_URL=postgresql://user:password@localhost:5432/portal_inmobiliario \
 *     npx tsx prisma/seed/relocate-properties.ts            # dry run: shows what would change
 *   ... npx tsx prisma/seed/relocate-properties.ts --apply   # writes, in one transaction
 *   ... npx tsx prisma/seed/relocate-properties.ts --restore=<backup.json> --apply   # undoes a run
 * A database that is not on localhost also needs --confirm-host=<host> to write. Before writing, the
 * current values of every row it will change are saved in projects/db-backups/ (not versioned).
 * Safe to run again: it only rewrites the same values.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Columns a relocation can change (the backup keeps exactly these). */
const COLUMNS = ["title", "description", "address", "region", "city", "commune", "price", "usableArea", "totalArea", "bedrooms", "bathrooms", "parkingSpaces", "ageInYears", "isFeatured"] as const;
type Column = (typeof COLUMNS)[number];
type Row = Record<Column, string | number | boolean | null>;

type Change = { id: string; label: string; data: Partial<Row>; features?: string[] };

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];
  return { apply: args.includes("--apply"), confirmHost: value("confirm-host"), restore: value("restore") };
}

function fullChange(relocation: Relocation): Change {
  const data = Object.fromEntries(COLUMNS.map((column) => [column, relocation[column]])) as Partial<Row>;
  return { id: relocation.id, label: relocation.title, data, features: relocation.features };
}

const changes: Change[] = [
  ...RELOCATIONS.map(fullChange),
  ...LOCATION_ONLY.map((item) => ({ id: item.id, label: item.note, data: { region: item.region, city: item.city, commune: item.commune } as Partial<Row> })),
];

async function main() {
  const connectionString = process.env.RELOCATE_DATABASE_URL;
  if (!connectionString) throw new Error("Set RELOCATE_DATABASE_URL (this script never falls back to DATABASE_URL)");
  const url = new URL(connectionString);
  const { apply, confirmHost, restore } = parseArgs();
  console.log(`Database: ${url.hostname}:${url.port || "5432"}${url.pathname}  mode: ${restore ? "RESTORE" : "relocate"} ${apply ? "(APPLY)" : "(dry run)"}`);
  if (apply && !LOCAL_HOSTS.has(url.hostname) && confirmHost !== url.hostname) {
    throw new Error(`Not a local database: pass --confirm-host=${url.hostname} to write to it`);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(getDatabaseConnectionConfig(connectionString)),
    transactionOptions: { maxWait: 10_000, timeout: 60_000 },
  });
  try {
    const featureIds = new Map((await prisma.feature.findMany()).map((feature) => [feature.name, feature.id]));
    if (restore) return await restoreFromBackup(prisma, restore, apply);

    const missingFeatures = [...new Set(changes.flatMap((change) => change.features ?? []))].filter((name) => !featureIds.has(name));
    if (missingFeatures.length > 0) throw new Error(`Features missing from the database: ${missingFeatures.join(", ")}`);

    const existing = await prisma.property.findMany({ where: { id: { in: changes.map((change) => change.id) } }, include: { features: true } });
    const byId = new Map(existing.map((property) => [property.id, property]));
    const pending: Change[] = [];
    let missing = 0;

    for (const change of changes) {
      const current = byId.get(change.id);
      if (!current) {
        missing += 1;
        console.log(`- ${change.id}: not in this database, skipped`);
        continue;
      }
      const differences = (Object.keys(change.data) as Column[]).filter((column) => String(current[column] ?? "") !== String(change.data[column] ?? ""));
      const featuresDiffer =
        change.features !== undefined &&
        current.features.map((link) => link.featureId).sort().join() !== change.features.map((name) => featureIds.get(name)!).sort().join();
      if (differences.length === 0 && !featuresDiffer) {
        console.log(`= ${change.id.slice(-12)}  already up to date`);
        continue;
      }
      pending.push(change);
      console.log(`~ ${change.id.slice(-12)}  ${current.city} / ${current.commune}  ->  ${change.data.city ?? current.city} / ${change.data.commune ?? current.commune}  [${[...differences, ...(featuresDiffer ? ["features"] : [])].join(", ")}]`);
    }

    // Rows that are in the database but not in the lists stay exactly as they are.
    const others = await prisma.property.findMany({ where: { id: { notIn: changes.map((change) => change.id) } }, select: { id: true, title: true, city: true, isPublished: true, deletedAt: true } });
    for (const other of others) console.log(`? not in the lists, left as is: ${other.id.slice(-12)}  ${other.title.slice(0, 50)} (${other.city}, ${other.isPublished ? "published" : "unpublished"}${other.deletedAt ? ", deleted" : ""})`);

    if (apply && pending.length > 0) {
      const backupFile = await writeBackup(prisma, pending.map((change) => change.id));
      console.log(`Backup of the current values: ${backupFile}`);
      // One transaction for every property: either all of them change or none does.
      await prisma.$transaction(async (tx) => {
        for (const change of pending) {
          await tx.property.update({ where: { id: change.id }, data: change.data as Parameters<typeof tx.property.update>[0]["data"] });
          if (change.features === undefined) continue;
          await tx.propertyFeature.deleteMany({ where: { propertyId: change.id } });
          if (change.features.length > 0) {
            await tx.propertyFeature.createMany({ data: change.features.map((name) => ({ propertyId: change.id, featureId: featureIds.get(name)! })) });
          }
        }
      });
    }
    console.log(`\n${pending.length} to update${apply ? " (written)" : " (nothing written: add --apply)"}, ${missing} not found, ${changes.length - pending.length - missing} already up to date`);
  } finally {
    await prisma.$disconnect();
  }
}

type Backup = { takenAt: string; rows: { id: string; values: Row; featureIds: string[] }[] };

async function writeBackup(prisma: PrismaClient, ids: string[]): Promise<string> {
  const rows = await prisma.property.findMany({ where: { id: { in: ids } }, include: { features: true } });
  const backup: Backup = {
    takenAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: row.id,
      values: Object.fromEntries(COLUMNS.map((column) => [column, row[column] === null ? null : typeof row[column] === "object" ? String(row[column]) : row[column]])) as Row,
      featureIds: row.features.map((link) => link.featureId),
    })),
  };
  const folder = resolve(process.cwd(), "../../projects/db-backups");
  mkdirSync(folder, { recursive: true });
  const file = join(folder, `properties-before-relocation-${backup.takenAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(backup, null, 2), "utf8");
  return file;
}

async function restoreFromBackup(prisma: PrismaClient, file: string, apply: boolean): Promise<void> {
  const backup = JSON.parse(readFileSync(file, "utf8")) as Backup;
  console.log(`Backup taken at ${backup.takenAt}: ${backup.rows.length} properties`);
  if (!apply) {
    console.log("Nothing written: add --apply to put these values back.");
    return;
  }
  await prisma.$transaction(async (tx) => {
    for (const row of backup.rows) {
      await tx.property.update({ where: { id: row.id }, data: row.values as Parameters<typeof tx.property.update>[0]["data"] });
      await tx.propertyFeature.deleteMany({ where: { propertyId: row.id } });
      if (row.featureIds.length > 0) await tx.propertyFeature.createMany({ data: row.featureIds.map((featureId) => ({ propertyId: row.id, featureId })) });
    }
  });
  console.log("Restored.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

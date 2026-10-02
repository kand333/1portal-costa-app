import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";
import { normalizeSearchText } from "@/lib/normalize-search-text";

// Integration test: the SQL function that fills Property.searchText and the application
// function that normalizes the searched words must agree, otherwise searches would miss.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function normalizeInDatabase(inputs: string[]): Promise<string[]> {
  const prisma = await getPrisma();
  const rows = await prisma.$queryRaw<{ normalized: string }[]>`
    SELECT search_normalize(input) AS normalized
    FROM unnest(${inputs}::text[]) WITH ORDINALITY AS inputs(input, position)
    ORDER BY position`;
  return rows.map((row) => row.normalized);
}

describe.skipIf(!hasDatabaseUrl)("search_normalize() SQL function", () => {
  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.$disconnect();
  });

  it("gives the same result as normalizeSearchText for every Latin letter with diacritics", async () => {
    // Latin-1 Supplement and Latin Extended-A: letters whose decomposition leaves an ASCII base letter.
    const letters = Array.from({ length: 0x180 - 0xc0 }, (_, index) => String.fromCharCode(0xc0 + index)).filter(
      (character) => /\p{L}/u.test(character) && /^[\x00-\x7f]+$/.test(normalizeSearchText(character)),
    );

    expect(letters.length).toBeGreaterThanOrEqual(150);
    expect(await normalizeInDatabase(letters)).toEqual(letters.map(normalizeSearchText));
  });

  it("gives the same result for realistic text, plain, accented and decomposed", async () => {
    const samples = [
      "Casa en Maipú con jardín",
      "ÑUÑOA - Región Metropolitana",
      "Departamento 3D2B, Av. Apoquindo 3000",
      "Maipu\u0301 y N\u0303un\u0303oa",
      "Pingüinos de Viña del Mar",
      "Šumava çà ũ Łódź",
      "",
    ];

    expect(await normalizeInDatabase(samples)).toEqual(samples.map(normalizeSearchText));
  });
});

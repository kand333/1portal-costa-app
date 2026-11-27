import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { getDatabaseConnectionConfig } from "../../src/lib/database-config";

/**
 * One-off: unpublishes every published property and publishes the Cochrane apartment (featured).
 * Run from apps/api (reads DATABASE_URL and CLOUDINARY_* from .env.local):
 *   npx tsx --env-file=.env.local prisma/seed/publish-cochrane-listing.ts                            # dry run
 *   npx tsx --env-file=.env.local prisma/seed/publish-cochrane-listing.ts --apply --confirm-host=<host>
 * Unpublished ids are saved to projects/db-backups/ before writing. Nothing is deleted.
 */
const PHOTOS_DIRECTORY = "C:/Users/cavbs/Desktop/fotos depa carol";
const PHOTOS = [
  "WhatsApp Image 2026-11-20 at 17.30.20.jpeg",
  "WhatsApp Image 2026-11-20 at 17.31.17.jpeg",
  "WhatsApp Image 2026-11-20 at 17.30.49.jpeg",
  "WhatsApp Image 2026-11-19 at 22.01.31.jpeg",
];
const IMAGES_FOLDER = "propiedades-claude";
const UPLOAD_TRANSFORMATION = "c_limit,w_2560,h_2560";

const TITLE = "Departamento 76 m² en pleno centro de Concepción, calle Cochrane: 2 dormitorios, 2 baños, estacionamiento y bodega";
const DESCRIPTION = `Departamento de 76 m² en el cuarto piso, en calle Cochrane, en pleno centro de Concepción. Una opción de inversión por ubicación, tamaño y conectividad, o para vivir.

Qué incluye
• 2 dormitorios y 2 baños
• Amplio living comedor
• Balcón con orientación poniente
• Cocina amoblada con extractor
• Logia con conexión para lavadora
• Gas natural
• 1 estacionamiento y 1 bodega

El edificio
Ascensor, conserjería y accesos controlados. Gastos comunes aproximados: $60.000 mensuales.

Ubicación
A una cuadra de Unimarc, Gangas y Líder, además de bancos y hoteles. Cerca del Instituto Virginio Gómez y AIEP, y a pocas cuadras de la Plaza de Armas. Locomoción a la puerta hacia todos los sectores de la ciudad.

Condición de venta
Se vende la nuda propiedad, mediante promesa de compraventa.

Escríbenos para coordinar una visita.`;
const FEATURES = ["Bodega", "Ascensor", "Conserjería", "Seguridad", "Balcón", "Gas natural"];

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const confirmHost = args.find((arg) => arg.startsWith("--confirm-host="))?.split("=")[1];

async function uploadToCloudinary(file: Buffer): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary env vars missing");
  const params: Record<string, string> = { folder: IMAGES_FOLDER, transformation: UPLOAD_TRANSFORMATION, timestamp: String(Math.floor(Date.now() / 1000)) };
  const toSign = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
  const body = new FormData();
  body.set("file", new Blob([new Uint8Array(file)], { type: "image/jpeg" }));
  for (const [key, value] of Object.entries(params)) body.set(key, value);
  body.set("api_key", apiKey);
  body.set("signature", createHash("sha1").update(toSign + apiSecret).digest("hex"));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: "POST", body });
  const result = (await response.json().catch(() => null)) as { secure_url?: string; public_id?: string } | null;
  if (!response.ok || !result?.secure_url || !result.public_id) throw new Error(`Cloudinary upload failed (HTTP ${response.status})`);
  return { url: result.secure_url, publicId: result.public_id };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL missing");
  const url = new URL(connectionString);
  console.log(`Database: ${url.hostname}${url.pathname}  ${apply ? "(APPLY)" : "(dry run)"}`);
  if (apply && confirmHost !== url.hostname) throw new Error(`Pass --confirm-host=${url.hostname} to write`);

  const prisma = new PrismaClient({ adapter: new PrismaPg(getDatabaseConnectionConfig(connectionString)) });
  try {
    const toUnpublish = await prisma.property.findMany({ where: { deletedAt: null, isPublished: true }, select: { id: true, title: true, isFeatured: true } });
    for (const property of toUnpublish) console.log(`- unpublish ${property.id.slice(-12)}  ${property.title.slice(0, 60)}`);
    const existing = await prisma.property.findFirst({ where: { title: TITLE, deletedAt: null }, select: { id: true } });
    console.log(existing ? `= listing already exists (${existing.id})` : "+ listing will be created");
    for (const photo of PHOTOS) readFileSync(join(PHOTOS_DIRECTORY, photo)); // fails early if a file is missing
    if (!apply) return console.log("\nNothing written: add --apply --confirm-host=<host>");

    const backupDirectory = resolve(process.cwd(), "../../projects/db-backups");
    mkdirSync(backupDirectory, { recursive: true });
    const backupFile = join(backupDirectory, `unpublished-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(backupFile, JSON.stringify({ takenAt: new Date().toISOString(), unpublished: toUnpublish }, null, 2));
    console.log(`Backup: ${backupFile}`);

    let listingId = existing?.id;
    if (!listingId) {
      const created = await prisma.property.create({
        data: {
          title: TITLE,
          description: DESCRIPTION,
          operationType: "SALE",
          propertyType: "APARTMENT",
          price: 100_000_000,
          currency: "CLP",
          usableArea: 76,
          totalArea: 76,
          bedrooms: 2,
          bathrooms: 2,
          parkingSpaces: 1,
          address: "Calle Cochrane, centro de Concepción",
          commune: "Concepción",
          city: "Concepción",
          region: "Región del Biobío",
          isPublished: false,
          isFeatured: true,
          features: { create: FEATURES.map((name) => ({ feature: { connectOrCreate: { where: { name }, create: { name } } } })) },
        },
        select: { id: true },
      });
      listingId = created.id;
      for (const [position, photo] of PHOTOS.entries()) {
        const uploaded = await uploadToCloudinary(readFileSync(join(PHOTOS_DIRECTORY, photo)));
        await prisma.propertyImage.create({ data: { propertyId: listingId, ...uploaded, position, isMain: position === 0 } });
        console.log(`  image ${position + 1}/${PHOTOS.length} uploaded`);
      }
    }

    // Unpublish the others and publish the listing together.
    await prisma.$transaction([
      prisma.property.updateMany({ where: { deletedAt: null, isPublished: true, id: { not: listingId } }, data: { isPublished: false } }),
      prisma.property.update({ where: { id: listingId }, data: { isPublished: true, isFeatured: true } }),
    ]);
    console.log(`\nDone. Listing ${listingId} published; ${toUnpublish.length} others unpublished.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

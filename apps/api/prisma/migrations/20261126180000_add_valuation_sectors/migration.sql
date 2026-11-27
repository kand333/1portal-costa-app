-- Reference prices of the price estimator: a base price per city and a coefficient per sector.
-- CreateTable
CREATE TABLE "ValuationCity" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "houseUfPerM2" DOUBLE PRECISION NOT NULL,
    "apartmentUfPerM2" DOUBLE PRECISION NOT NULL,
    "landUfPerM2" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationSector" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'estimado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationSector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValuationCity_name_key" ON "ValuationCity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ValuationSector_cityId_name_key" ON "ValuationSector"("cityId", "name");

-- CreateIndex
CREATE INDEX "ValuationSector_commune_idx" ON "ValuationSector"("commune");

-- AddForeignKey
ALTER TABLE "ValuationSector" ADD CONSTRAINT "ValuationSector_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "ValuationCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Initial data (rough figures, to be reviewed from the admin): Concepción, 15 sectors. Bases anchored on published listings of 2026
-- (houses of Concepción: median about UF 50 per m²; apartments about UF 50 to 55).
-- Base prices in UF per square meter; each sector multiplies them by its coefficient.
WITH city AS (
  INSERT INTO "ValuationCity" ("id", "name", "houseUfPerM2", "apartmentUfPerM2", "landUfPerM2", "updatedAt")
  VALUES (gen_random_uuid(), 'Concepción', 48, 52, 9, CURRENT_TIMESTAMP)
  RETURNING "id"
)
INSERT INTO "ValuationSector" ("id", "cityId", "name", "commune", "latitude", "longitude", "coefficient", "note", "source", "updatedAt")
SELECT gen_random_uuid(), city."id", sector."name", sector."commune", sector."latitude", sector."longitude", sector."coefficient",
       'Centro aproximado y coeficiente estimado: revisar.', 'estimado', CURRENT_TIMESTAMP
FROM city, (VALUES
    ('Centro', 'Concepción', -36.827, -73.0503, 0.92),
    ('Barrio Norte', 'Concepción', -36.8115, -73.05, 0.95),
    ('Barrio Universitario', 'Concepción', -36.8285, -73.033, 0.9),
    ('Collao', 'Concepción', -36.8425, -73.0262, 0.88),
    ('Palomares', 'Concepción', -36.819, -73.029, 0.85),
    ('Pedro de Valdivia Bajo', 'Concepción', -36.801, -73.038, 1.15),
    ('Pedro de Valdivia Alto', 'Concepción', -36.793, -73.027, 1.3),
    ('Lomas de San Andrés', 'Concepción', -36.803, -73.065, 1.28),
    ('Lomas de San Sebastián', 'Concepción', -36.81, -73.062, 1.22),
    ('Nonguén', 'Concepción', -36.853, -72.998, 0.8),
    ('Chillancito', 'Concepción', -36.856, -73.045, 0.78),
    ('Agüita de la Perdiz', 'Concepción', -36.833, -73.064, 1.05),
    ('Cerro Caracol', 'Concepción', -36.838, -73.045, 1.1),
    ('Lorenzo Arenas', 'Concepción', -36.818, -73.011, 0.82),
    ('Laguna Redonda', 'Concepción', -36.869, -73.037, 0.92)
) AS sector ("name", "commune", "latitude", "longitude", "coefficient");

-- The other communes of Gran Concepción start with a base price only (no sectors yet): add their sectors from the admin.
INSERT INTO "ValuationCity" ("id", "name", "houseUfPerM2", "apartmentUfPerM2", "landUfPerM2", "updatedAt") VALUES
    (gen_random_uuid(), 'San Pedro de la Paz', 50, 56, 9.5, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Talcahuano', 36, 40, 6, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Hualpén', 36, 38, 6, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Chiguayante', 38, 41, 6.5, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Coronel', 28, 30, 4, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Penco', 30, 33, 5, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Tomé', 28, 30, 4.5, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Lota', 20, 22, 3, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Hualqui', 24, 25, 3.5, CURRENT_TIMESTAMP);

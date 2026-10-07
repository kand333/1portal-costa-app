-- Prices move from US dollars to Chilean pesos at a fixed 950 CLP/USD.
-- Sales are rounded to the million and rents to $10.000 (never below that unit).
ALTER TYPE "Currency" RENAME VALUE 'USD' TO 'CLP';

ALTER TABLE "Property" ALTER COLUMN "currency" SET DEFAULT 'CLP';

UPDATE "Property"
SET "price" = CASE
  WHEN "operationType" = 'SALE' THEN GREATEST(ROUND("price" * 950 / 1000000), 1) * 1000000
  ELSE GREATEST(ROUND("price" * 950 / 10000), 1) * 10000
END;

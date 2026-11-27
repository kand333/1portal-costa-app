-- Public listing number: the sequence starts at 5888; existing properties are numbered first
-- (published first, newest first), so new ones continue the series.
CREATE SEQUENCE "Property_code_seq" START 5888;

ALTER TABLE "Property" ADD COLUMN "code" INTEGER;

UPDATE "Property" AS property
SET "code" = numbered."code"
FROM (
  SELECT "id", nextval('"Property_code_seq"')::INTEGER AS "code"
  FROM (SELECT "id" FROM "Property" ORDER BY "isPublished" DESC, "createdAt" DESC, "id" DESC) AS ordered
) AS numbered
WHERE property."id" = numbered."id";

ALTER TABLE "Property" ALTER COLUMN "code" SET DEFAULT nextval('"Property_code_seq"');
ALTER TABLE "Property" ALTER COLUMN "code" SET NOT NULL;
ALTER SEQUENCE "Property_code_seq" OWNED BY "Property"."code";

CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

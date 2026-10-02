-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '';

-- Search normalization: lowercase and without accents (ñ -> n, é -> e, ...).
-- translate() is IMMUTABLE and needs no extension (unlike unaccent). Uppercase letters are mapped
-- first so the result does not depend on the database locale. The application normalizes the
-- searched words the same way (apps/api/src/lib/normalize-search-text.ts); a test keeps both aligned.
CREATE FUNCTION search_normalize(input text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT lower(translate(
    input,
    'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
    'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuyy'
  ))
$$;

-- Keeps "searchText" in sync on every insert or update of the searchable columns,
-- whoever writes them (application, seed, manual SQL).
CREATE FUNCTION property_set_search_text() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."searchText" := search_normalize(
    concat_ws(' ', NEW."title", NEW."description", NEW."commune", NEW."city", NEW."region")
  );
  RETURN NEW;
END
$$;

CREATE TRIGGER "Property_set_search_text"
BEFORE INSERT OR UPDATE OF "title", "description", "commune", "city", "region" ON "Property"
FOR EACH ROW EXECUTE FUNCTION property_set_search_text();

-- Backfill existing rows: naming a trigger column in SET fires the trigger even if its value is unchanged.
UPDATE "Property" SET "title" = "title";

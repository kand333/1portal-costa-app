-- search_normalize() now relies on standard Unicode normalization instead of a table of letters:
-- decompose (NFD) so every accented letter becomes its base letter plus combining marks, drop the
-- marks and lowercase. It handles any Latin letter with diacritics (ñ, é, ç, ũ, š...) and text
-- stored in either composed or decomposed form. The application does the same in
-- apps/api/src/lib/normalize-search-text.ts; a database test keeps both aligned.
-- Requires PostgreSQL 13+ (normalize()) and a UTF8 database (the project's default).
CREATE OR REPLACE FUNCTION search_normalize(input text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT lower(regexp_replace(normalize(input, NFD), '[\u0300-\u036f]', '', 'g'))
$$;

-- Recompute "searchText" of existing rows with the final function (the trigger fires on SET).
UPDATE "Property" SET "title" = "title";

-- Refines search_normalize(): besides mapping accented Latin-1 letters (same table as
-- apps/api/src/lib/normalize-search-text.ts), it removes combining diacritical marks so text stored
-- in decomposed Unicode form ("u" + separate acute accent) is normalized like its composed form.
CREATE OR REPLACE FUNCTION search_normalize(input text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT lower(regexp_replace(
    translate(
      input,
      'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
      'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuyy'
    ),
    '[\u0300-\u036f]',
    '',
    'g'
  ))
$$;

-- Recompute "searchText" of existing rows with the refined function (the trigger fires on SET).
UPDATE "Property" SET "title" = "title";

-- Fixed search_path for the search functions (Supabase advisor: "function search path mutable").
-- Without it the trigger resolves `search_normalize` through the caller's search_path, so it
-- breaks when that is empty (e.g. a pg_dump restore) and could be hijacked by another schema.
-- search_normalize only uses built-in functions (pg_catalog is always searched).
ALTER FUNCTION public.search_normalize(text) SET search_path = '';
ALTER FUNCTION public.property_set_search_text() SET search_path = public;

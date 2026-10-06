-- Row Level Security on every table, without policies: nobody but the owner or a role with
-- BYPASSRLS can read or write rows.
-- * On Supabase, tables in `public` can be reached through the Data API with the public keys
--   (`anon` / `authenticated`); with RLS on and no policies, those roles see no rows.
-- * The API is not affected: it connects as the table owner (local `portal_app`) or as the
--   dedicated `prisma` role with BYPASSRLS (Supabase). Access control stays in the API.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyFeature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InquiryMessage" ENABLE ROW LEVEL SECURITY;
-- `_prisma_migrations` is Prisma's own table (absent from the shadow database): it is locked
-- down once, when the Supabase database is set up (see README).

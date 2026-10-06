import { SUPABASE_ROOT_CA } from "@/lib/supabase-root-ca";

/** SSL options of a connection string. `pg` lets them override the `ssl` object, so they are dropped. */
const SSL_URL_PARAMS = ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat", "sslaccept"];

const isSupabaseHost = (hostname: string) => hostname.endsWith(".supabase.com") || hostname.endsWith(".supabase.co");

export type DatabaseConnectionConfig = {
  connectionString: string;
  ssl?: { ca: string; rejectUnauthorized: true };
};

/**
 * Connection options for the `pg` driver. A Supabase host always gets TLS verified against the
 * bundled Supabase CA (certificate chain and host name, like `sslmode=verify-full`), whatever SSL
 * parameters the URL carries; this works the same locally and on serverless (Vercel). Any other
 * host (the local Docker database) is used as given.
 */
export function getDatabaseConnectionConfig(databaseUrl: string): DatabaseConnectionConfig {
  const url = new URL(databaseUrl);
  if (!isSupabaseHost(url.hostname)) return { connectionString: databaseUrl };

  for (const param of SSL_URL_PARAMS) url.searchParams.delete(param);
  return { connectionString: url.toString(), ssl: { ca: SUPABASE_ROOT_CA, rejectUnauthorized: true } };
}

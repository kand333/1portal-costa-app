import { SUPABASE_ROOT_CA } from "@/lib/supabase-root-ca";

/** SSL options of a connection string. `pg` lets them override the `ssl` object, so they are dropped. */
const SSL_URL_PARAMS = ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat", "sslaccept"];

const isSupabaseHost = (hostname: string) => hostname.endsWith(".supabase.com") || hostname.endsWith(".supabase.co");

export type DatabaseConnectionConfig = {
  connectionString: string;
  ssl?: { ca: string; rejectUnauthorized: true };
  /** Connections this process may hold open. */
  max?: number;
  /** Idle connections are closed after this long, so a frozen serverless instance does not keep one. */
  idleTimeoutMillis?: number;
};

/**
 * Connections per process against Supabase. Each serverless instance (Vercel) has its own pool, and the Supabase
 * pooler in session mode allows only 15 clients in total: with the `pg` default of 10 per instance a few parallel
 * requests exhaust it («EMAXCONNSESSION: max clients reached»). One per instance in production, a few in development;
 * `DATABASE_POOL_MAX` overrides it.
 */
function poolSize(env: NodeJS.ProcessEnv): number {
  const configured = Number(env.DATABASE_POOL_MAX);
  if (Number.isInteger(configured) && configured >= 1) return configured;
  return env.NODE_ENV === "production" ? 1 : 5;
}

/**
 * Connection options for the `pg` driver. A Supabase host always gets TLS verified against the
 * bundled Supabase CA (certificate chain and host name, like `sslmode=verify-full`), whatever SSL
 * parameters the URL carries; this works the same locally and on serverless (Vercel). Any other
 * host (the local Docker database) is used as given.
 */
export function getDatabaseConnectionConfig(databaseUrl: string, env: NodeJS.ProcessEnv = process.env): DatabaseConnectionConfig {
  const url = new URL(databaseUrl);
  if (!isSupabaseHost(url.hostname)) return { connectionString: databaseUrl };

  for (const param of SSL_URL_PARAMS) url.searchParams.delete(param);
  return {
    connectionString: url.toString(),
    ssl: { ca: SUPABASE_ROOT_CA, rejectUnauthorized: true },
    max: poolSize(env),
    idleTimeoutMillis: 10_000,
  };
}

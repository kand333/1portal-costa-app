import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getDatabaseConnectionConfig } from "./database-config";
import { SUPABASE_ROOT_CA } from "./supabase-root-ca";

const pooler = "postgresql://prisma.ref:p%40ss@aws-0-us-west-2.pooler.supabase.com";

describe("getDatabaseConnectionConfig", () => {
  it("verifies Supabase with the bundled CA, dropping the URL's SSL parameters (they would override it)", () => {
    for (const url of [
      `${pooler}:5432/postgres?sslmode=verify-full&sslrootcert=certs/prod-ca-2021.crt`,
      `${pooler}:6543/postgres?sslmode=require`,
      `${pooler}:6543/postgres`,
    ]) {
      const config = getDatabaseConnectionConfig(url);
      expect(config.ssl).toEqual({ ca: SUPABASE_ROOT_CA, rejectUnauthorized: true });
      expect(config.connectionString).not.toMatch(/ssl/);
      expect(new URL(config.connectionString).password).toBe("p%40ss");
    }
    expect(getDatabaseConnectionConfig("postgresql://postgres:x@db.abc.supabase.co:5432/postgres").ssl).toBeDefined();
  });

  it("keeps other parameters and leaves a local database as given", () => {
    expect(getDatabaseConnectionConfig(`${pooler}:6543/postgres?sslmode=require&connection_limit=1`).connectionString).toBe(
      `${pooler}:6543/postgres?connection_limit=1`,
    );
    const local = "postgresql://portal_app:secret@localhost:5432/portal_inmobiliario";
    expect(getDatabaseConnectionConfig(local)).toEqual({ connectionString: local });
  });

  it("bundles the same certificate as certs/prod-ca-2021.crt: the Supabase Root 2021 CA", () => {
    const certificate = new X509Certificate(SUPABASE_ROOT_CA);
    expect(certificate.subject).toContain("CN=Supabase Root 2021 CA");
    expect(certificate.fingerprint256).toBe(new X509Certificate(readFileSync("certs/prod-ca-2021.crt")).fingerprint256);
  });
});

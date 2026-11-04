/** Public origin of the site (no trailing slash), from `NEXT_PUBLIC_SITE_URL`. In production it must be the real domain. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

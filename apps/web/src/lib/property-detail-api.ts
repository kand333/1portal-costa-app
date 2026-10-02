import type { PropertyDetail } from "@portal/shared/property";
import { propertyIdSchema } from "@portal/shared/property-query";

/** Backend base URL, reachable from this server (same value as the /api rewrites). */
const apiInternalUrl = () => process.env.API_INTERNAL_URL ?? "http://localhost:4000";

/**
 * Loads a published property from the REST API, for Server Components.
 * Returns null when it does not exist, is not published or the id is invalid (a 404 for the page);
 * any other failure throws so the error boundary can offer a retry.
 */
export async function fetchPropertyDetail(id: string): Promise<PropertyDetail | null> {
  if (!propertyIdSchema.safeParse(id).success) return null;

  const response = await fetch(`${apiInternalUrl()}/api/properties/${id}`, {
    headers: { Accept: "application/json" },
    // Admin edits and unpublishing must show up immediately.
    cache: "no-store",
  });
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) throw new Error(`No fue posible cargar la propiedad (HTTP ${response.status})`);
  return response.json() as Promise<PropertyDetail>;
}

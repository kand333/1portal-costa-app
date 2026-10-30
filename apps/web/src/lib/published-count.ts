import type { PaginatedResponse, PropertySummary } from "@portal/shared/property";
import { apiInternalUrl } from "./api-internal-url";

/** Number of published properties, for Server Components. Null when the API cannot answer: the caller omits the figure. */
export async function fetchPublishedCount(operation?: "SALE" | "RENT"): Promise<number | null> {
  try {
    const response = await fetch(`${apiInternalUrl()}/api/properties?pageSize=1${operation ? `&operation=${operation}` : ""}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as PaginatedResponse<PropertySummary>;
    return body.meta.total;
  } catch {
    return null;
  }
}

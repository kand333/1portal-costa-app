import { toErrorResponse } from "@/lib/http/api-error";
import { getPropertyFilterOptions } from "@/services/property-service";

/** Values for the catalog filters: regions, cities and communes that have published properties. */
export async function GET() {
  try {
    return Response.json(await getPropertyFilterOptions());
  } catch (error) {
    return toErrorResponse(error);
  }
}

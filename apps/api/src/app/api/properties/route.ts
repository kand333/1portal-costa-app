import type { NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { propertyListQuerySchema } from "@portal/shared/property-query";
import { listPublishedProperties } from "@/services/property-service";

/** Query string as an object: a repeated parameter becomes an array (`?commune=a&commune=b`). */
function readQuery(searchParams: URLSearchParams): Record<string, string | string[]> {
  return Object.fromEntries(
    [...new Set(searchParams.keys())].map((name) => {
      const values = searchParams.getAll(name);
      return [name, values.length > 1 ? values : values[0]];
    }),
  );
}

export async function GET(request: NextRequest) {
  const query = propertyListQuerySchema.safeParse(readQuery(request.nextUrl.searchParams));
  if (!query.success) {
    // Rules written for users (e.g. "minimum price greater than maximum") carry their own message;
    // the generic validation messages are not meant for them.
    const customIssue = query.error.issues.find((issue) => issue.code === "custom");
    return errorResponse(400, customIssue?.message ?? "Parámetros de consulta inválidos");
  }

  try {
    return Response.json(await listPublishedProperties(query.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

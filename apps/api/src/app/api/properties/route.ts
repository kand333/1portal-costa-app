import type { NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { propertyListQuerySchema } from "@portal/shared/property-query";
import { listPublishedProperties } from "@/services/property-service";

export async function GET(request: NextRequest) {
  const query = propertyListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) {
    return errorResponse(400, "Parámetros de consulta inválidos");
  }

  try {
    return Response.json(await listPublishedProperties(query.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

import type { NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { propertyIdSchema } from "@portal/shared/property-query";
import { getPublishedPropertyDetail } from "@/services/property-service";

export async function GET(_request: NextRequest, context: RouteContext<"/api/properties/[id]">) {
  const { id } = await context.params;
  if (!propertyIdSchema.safeParse(id).success) {
    return errorResponse(400, "Identificador de propiedad inválido");
  }

  try {
    return Response.json(await getPublishedPropertyDetail(id));
  } catch (error) {
    return toErrorResponse(error);
  }
}

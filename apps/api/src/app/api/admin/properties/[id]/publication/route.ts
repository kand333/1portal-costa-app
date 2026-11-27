import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { changePropertyPublication } from "@/services/admin-property-service";
import { propertyPublicationSchema } from "@portal/shared/admin-property";
import { propertyIdSchema } from "@portal/shared/property-query";

type PublicationContext = RouteContext<"/api/admin/properties/[id]/publication">;

/** Publishes or unpublishes a property (`{ isPublished }`) without touching its other fields. ADMIN only. */
export async function PATCH(request: NextRequest, context: PublicationContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, "Identificador de propiedad inválido");
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = propertyPublicationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de publicación inválidos");
    return NextResponse.json(await changePropertyPublication(id, parsed.data.isPublished));
  } catch (error) {
    return toErrorResponse(error);
  }
}

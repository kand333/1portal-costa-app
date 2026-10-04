import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { removePropertyImage } from "@/services/property-image-service";
import { propertyImageIdSchema } from "@portal/shared/property-image";
import { propertyIdSchema } from "@portal/shared/property-query";

/** Deletes an image of a property, from Cloudinary and PostgreSQL. ADMIN only. */
export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/admin/properties/[id]/images/[imageId]">,
) {
  try {
    await requireAdmin(request);
    const { id, imageId } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, "Identificador de propiedad inválido");
    if (!propertyImageIdSchema.safeParse(imageId).success) return errorResponse(400, "Identificador de imagen inválido");
    await removePropertyImage(id, imageId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

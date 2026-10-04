import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { addFavorite, removeFavorite } from "@/services/favorite-service";
import { propertyIdSchema } from "@portal/shared/property-query";

type FavoriteContext = RouteContext<"/api/favorites/[propertyId]">;

/** Saves a property for the logged-in user. Idempotent: saving it twice keeps one favorite. */
export async function POST(request: NextRequest, context: FavoriteContext) {
  try {
    const user = await requireRole(request, ["USER"]);
    const { propertyId } = await context.params;
    if (!propertyIdSchema.safeParse(propertyId).success) return errorResponse(400, "Identificador de propiedad inválido");

    await addFavorite(user, propertyId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Removes a saved property. Idempotent. */
export async function DELETE(request: NextRequest, context: FavoriteContext) {
  try {
    const user = await requireRole(request, ["USER"]);
    const { propertyId } = await context.params;
    if (!propertyIdSchema.safeParse(propertyId).success) return errorResponse(400, "Identificador de propiedad inválido");

    await removeFavorite(user, propertyId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

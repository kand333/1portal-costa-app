import "server-only";
import { ApiError } from "@/lib/http/api-error";
import { deleteFavorite, findFavoriteProperties, saveFavorite } from "@/repositories/favorite-repository";
import { findPublishedPropertyById } from "@/repositories/property-repository";
import { toPropertySummary } from "@/services/property-service";
import type { AuthUser } from "@portal/shared/auth";
import type { PropertySummary } from "@portal/shared/property";

export async function listFavorites(user: AuthUser): Promise<PropertySummary[]> {
  return (await findFavoriteProperties(user.id)).map(toPropertySummary);
}

/** Only published properties can be saved. Idempotent. */
export async function addFavorite(user: AuthUser, propertyId: string): Promise<void> {
  if (!(await findPublishedPropertyById(propertyId))) throw new ApiError(404, "Propiedad no encontrada");
  await saveFavorite(user.id, propertyId);
}

/** Idempotent: works even if the property is no longer published or was never saved. */
export async function removeFavorite(user: AuthUser, propertyId: string): Promise<void> {
  await deleteFavorite(user.id, propertyId);
}

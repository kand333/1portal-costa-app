import { mutate } from "swr";
import { sendJson } from "./api-client";

export const FAVORITES_KEY = "/api/favorites";

/** Saves or removes a property, then reloads the favorites shared through the SWR cache. */
export async function setFavorite(propertyId: string, isFavorite: boolean): Promise<void> {
  await sendJson<void>(isFavorite ? "POST" : "DELETE", `${FAVORITES_KEY}/${propertyId}`);
  await mutate(FAVORITES_KEY);
}

"use client";

import type { PropertySummary } from "@portal/shared/property";
import useSWR from "swr";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchJson } from "@/lib/api-client";
import { FAVORITES_KEY } from "@/lib/favorites-client";

/**
 * Saved properties of the logged-in user (one request shared by every card through SWR).
 * Visitors and administrators make no request (favorites are a USER feature): `data` stays undefined.
 */
export function useFavorites() {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const favorites = useSWR<PropertySummary[], Error>(currentUser && !isAdmin ? FAVORITES_KEY : null, fetchJson);
  return { ...favorites, isLoggedIn: Boolean(currentUser), isAdmin, isUserLoading };
}

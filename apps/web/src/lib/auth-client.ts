import type { AuthUser, LoginData, RegisterData } from "@portal/shared/auth";
import { mutate } from "swr";
import { ApiClientError, fetchJson, postJson } from "./api-client";

export const CURRENT_USER_KEY = "/api/auth/me";

/** The session user, or null when there is no session (401). Other errors are thrown. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    return await fetchJson<AuthUser>(CURRENT_USER_KEY);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null;
    throw error;
  }
}

/** Creates the account; the API also starts the session (httpOnly cookie). */
export async function registerAccount(data: RegisterData): Promise<AuthUser> {
  const user = await postJson<AuthUser>("/api/auth/register", data);
  await mutate(CURRENT_USER_KEY, user, { revalidate: false });
  return user;
}

export async function logIn(data: LoginData): Promise<AuthUser> {
  const user = await postJson<AuthUser>("/api/auth/login", data);
  await mutate(CURRENT_USER_KEY, user, { revalidate: false });
  return user;
}

export async function logOut(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) throw new ApiClientError(response.status, "No pudimos cerrar la sesión");
  await mutate(CURRENT_USER_KEY, null, { revalidate: false });
}

/**
 * Where to go after logging in: the `next` path of the URL when it is a page of this site,
 * otherwise the home page. Blocks open redirects such as "//evil.com" or "https://…".
 */
export function getSafeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

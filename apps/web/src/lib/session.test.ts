import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminUser, getSessionUser, requireSessionUser } from "./session";

const { cookieStore, redirectMock } = vi.hoisted(() => ({
  cookieStore: { value: undefined as string | undefined },
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "portal_session" && cookieStore.value ? { value: cookieStore.value } : undefined),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
// React's cache() only memoizes inside a server render; here every call runs.
vi.mock("react", async (importOriginal) => ({ ...(await importOriginal<typeof import("react")>()), cache: <T>(fn: T) => fn }));

const user = { id: "u1", name: "Ana", email: "ana@test.com", role: "USER", isActive: true };

beforeEach(() => {
  cookieStore.value = undefined;
  vi.stubEnv("API_INTERNAL_URL", "http://api.test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  redirectMock.mockClear();
});

describe("getSessionUser", () => {
  it("returns null without a session cookie, without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getSessionUser()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the API for the user, forwarding the session cookie and skipping caches", async () => {
    cookieStore.value = "signed.token";
    const fetchMock = vi.fn().mockResolvedValue(Response.json(user));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSessionUser()).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/auth/me",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Cookie: "portal_session=signed.token" }),
      }),
    );
  });

  it("returns null when the API rejects the session (expired, forged, deactivated)", async () => {
    cookieStore.value = "expired.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: 401 }, { status: 401 })));
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("throws when the API fails, instead of treating the user as logged out", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("down", { status: 503 })));
    await expect(getSessionUser()).rejects.toThrow("HTTP 503");
  });
});

describe("requireSessionUser", () => {
  it("returns the user when there is a session", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(user)));
    await expect(requireSessionUser("/account")).resolves.toEqual(user);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("sends visitors to the login, keeping the page to return to", async () => {
    await expect(requireSessionUser("/account")).rejects.toThrow("NEXT_REDIRECT /login?next=%2Faccount");
  });
});

describe("getAdminUser", () => {
  it("returns the user when it is an ADMIN", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...user, role: "ADMIN" })));
    await expect(getAdminUser("/admin")).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("returns null for a USER", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(user)));
    await expect(getAdminUser("/admin")).resolves.toBeNull();
  });

  it("sends visitors to the login", async () => {
    await expect(getAdminUser("/admin")).rejects.toThrow("NEXT_REDIRECT /login?next=%2Fadmin");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUser, getSafeRedirectPath, logIn, logOut, registerAccount } from "./auth-client";

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }));
vi.mock("swr", () => ({ mutate: mutateMock }));

const user = { id: "u1", name: "Ana", email: "ana@correo.cl", role: "USER", isActive: true };

afterEach(() => {
  vi.unstubAllGlobals();
  mutateMock.mockReset();
});

describe("fetchCurrentUser", () => {
  it("returns the session user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(user)));
    await expect(fetchCurrentUser()).resolves.toEqual(user);
  });

  it("returns null without a session (401)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "No has iniciado sesión", status: 401 }, { status: 401 })),
    );
    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it("throws other errors so they are not mistaken for a logged-out user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));
    await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 502 });
  });
});

describe("login, registration and logout", () => {
  it("logs in and stores the user in the shared session cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(user));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logIn({ email: "ana@correo.cl", password: "clave segura" })).resolves.toEqual(user);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/login");
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", user, { revalidate: false });
  });

  it("registers and stores the new user in the session cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(user, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await registerAccount({ name: "Ana", email: "ana@correo.cl", password: "clave segura" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/register");
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", user, { revalidate: false });
  });

  it("does not touch the session cache when the login is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Email o contraseña incorrectos", status: 401 }, { status: 401 })),
    );
    await expect(logIn({ email: "ana@correo.cl", password: "x" })).rejects.toMatchObject({
      message: "Email o contraseña incorrectos",
    });
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("logs out and clears the session cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await logOut();
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", null, { revalidate: false });
  });
});

describe("getSafeRedirectPath", () => {
  it.each([
    ["/account", "/account"],
    ["/properties?operation=RENT", "/properties?operation=RENT"],
    [null, "/"],
    ["", "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["javascript:alert(1)", "/"],
  ])("%o → %o", (next, expected) => {
    expect(getSafeRedirectPath(next)).toBe(expected);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { setFavorite } from "./favorites-client";

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }));
vi.mock("swr", () => ({ mutate: mutateMock }));

afterEach(() => {
  vi.unstubAllGlobals();
  mutateMock.mockReset();
});

describe("setFavorite", () => {
  it.each([
    [true, "POST"],
    [false, "DELETE"],
  ])("saving=%s sends %s and reloads the favorites", async (isFavorite, method) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await setFavorite("p1", isFavorite);
    expect(fetchMock).toHaveBeenCalledWith("/api/favorites/p1", expect.objectContaining({ method, body: undefined }));
    expect(mutateMock).toHaveBeenCalledWith("/api/favorites");
  });

  it("throws the API error and does not reload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Propiedad no encontrada", status: 404 }, { status: 404 })),
    );
    await expect(setFavorite("p1", true)).rejects.toMatchObject({ message: "Propiedad no encontrada" });
    expect(mutateMock).not.toHaveBeenCalled();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { createFeature, deleteFeature, renameFeature } from "./admin-features";

afterEach(() => vi.unstubAllGlobals());

describe("feature catalog requests", () => {
  it("creates, renames and deletes through the admin API", async () => {
    const feature = { id: "f1", name: "Sauna", propertyCount: 0 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(feature, { status: 201 }))
      .mockResolvedValueOnce(Response.json(feature))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createFeature("Sauna")).resolves.toEqual(feature);
    await renameFeature("f1", "Sauna seca");
    await deleteFeature("f1");
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body ? JSON.parse(init.body) : null])).toEqual([
      ["/api/admin/features", "POST", { name: "Sauna" }],
      ["/api/admin/features/f1", "PUT", { name: "Sauna seca" }],
      ["/api/admin/features/f1", "DELETE", null],
    ]);
  });

  it("throws the API message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Ya existe una característica con ese nombre", status: 409 }, { status: 409 })));
    await expect(createFeature("Piscina")).rejects.toThrow("Ya existe una característica con ese nombre");
  });
});

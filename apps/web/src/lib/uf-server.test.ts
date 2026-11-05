import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchUfValue, formatUf } from "./uf-server";

const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("fetchUfValue", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the latest value of the series", async () => {
    vi.stubGlobal("fetch", vi.fn(() => reply({ serie: [{ valor: 41269.5 }, { valor: 41000 }] })));
    expect(await fetchUfValue()).toBe(41269.5);
  });

  it("returns null on an error status, a bad value or a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(() => reply({}, 500)));
    expect(await fetchUfValue()).toBeNull();
    vi.stubGlobal("fetch", vi.fn(() => reply({ serie: [{ valor: "x" }] })));
    expect(await fetchUfValue()).toBeNull();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("down"))));
    expect(await fetchUfValue()).toBeNull();
  });
});

describe("formatUf", () => {
  it("shows whole pesos with Chilean separators", () => {
    expect(formatUf(41269.4)).toBe("UF $41.269");
  });
});

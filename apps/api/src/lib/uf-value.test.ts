import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUfQuote, getUfValue, resetUfCache } from "./uf-value";

const respond = (valor: unknown) =>
  vi.fn().mockResolvedValue({ ok: true, json: async () => ({ serie: [{ valor, fecha: "2026-10-23T03:00:00.000Z" }] }) });

beforeEach(() => resetUfCache());
afterEach(() => vi.unstubAllGlobals());

describe("getUfValue", () => {
  it("reads the value of the day and caches it for six hours", async () => {
    const fetchMock = respond(39_000.5);
    vi.stubGlobal("fetch", fetchMock);
    expect(await getUfValue(1_000)).toBe(39_000.5);
    expect(await getUfValue(1_000 + 5 * 60 * 60 * 1000)).toBe(39_000.5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await getUfValue(1_000 + 7 * 60 * 60 * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null when the service fails or answers nonsense", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await getUfValue()).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await getUfValue()).toBeNull();
    vi.stubGlobal("fetch", respond("abc"));
    expect(await getUfValue()).toBeNull();
    vi.stubGlobal("fetch", respond(-5));
    expect(await getUfValue()).toBeNull();
  });

  it("keeps the last known value when a refresh fails", async () => {
    vi.stubGlobal("fetch", respond(38_000));
    expect(await getUfValue(0)).toBe(38_000);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await getUfValue(10 * 60 * 60 * 1000)).toBe(38_000);
  });
});

describe("getUfQuote", () => {
  it("returns the day the value is valid for", async () => {
    vi.stubGlobal("fetch", respond(39_000.5));
    expect(await getUfQuote()).toEqual({ value: 39_000.5, date: "2026-10-23" });
  });
});

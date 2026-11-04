import { afterEach, describe, expect, it, vi } from "vitest";
import { getMeasurementId, trackEvent } from "./analytics";

describe("analytics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts a GA4 measurement id and ignores anything else", () => {
    expect(getMeasurementId("G-ABC123XYZ9")).toBe("G-ABC123XYZ9");
    expect(getMeasurementId("  G-ABC123XYZ9 ")).toBe("G-ABC123XYZ9");
    expect(getMeasurementId("UA-12345-1")).toBeNull();
    expect(getMeasurementId("G-abc")).toBeNull();
    expect(getMeasurementId("G-ABC'); alert(1);//")).toBeNull();
    expect(getMeasurementId("")).toBeNull();
    expect(getMeasurementId(undefined)).toBeNull();
  });

  it("sends the event through gtag when it is loaded", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    trackEvent("generate_lead", { lead_source: "tasador" });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", { lead_source: "tasador" });
  });

  it("does nothing when gtag is not loaded or there is no window", () => {
    vi.stubGlobal("window", {});
    expect(() => trackEvent("whatsapp_click")).not.toThrow();
    vi.unstubAllGlobals();
    expect(() => trackEvent("whatsapp_click")).not.toThrow();
  });
});

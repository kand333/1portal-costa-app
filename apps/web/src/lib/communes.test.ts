import { describe, expect, it } from "vitest";
import { COMMUNE_NAMES, COVERAGE_COMMUNES } from "./communes";

describe("COVERAGE_COMMUNES", () => {
  it("places every commune inside Gran Concepción, with unique names", () => {
    for (const commune of COVERAGE_COMMUNES) {
      expect(commune.latitude, commune.name).toBeGreaterThan(-37.2);
      expect(commune.latitude, commune.name).toBeLessThan(-36.5);
      expect(commune.longitude, commune.name).toBeGreaterThan(-73.3);
      expect(commune.longitude, commune.name).toBeLessThan(-72.8);
    }
    expect(new Set(COMMUNE_NAMES).size).toBe(COMMUNE_NAMES.length);
  });

  it("starts with Concepción, the hub of the network lines", () => {
    expect(COVERAGE_COMMUNES[0].name).toBe("Concepción");
  });
});

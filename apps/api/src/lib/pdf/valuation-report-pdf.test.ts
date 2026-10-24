import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { describe, expect, it } from "vitest";
import { buildReportContent } from "@/services/valuation-report-data";
import { renderValuationReport } from "./valuation-report-pdf";

type OkResult = Extract<ValuationResult, { status: "ok" }>;

// Clearly fake data: the sample is a test fixture, not a real property.
const request: ValuationRequest = {
  address: "DATOS DE PRUEBA: Calle Ejemplo 123",
  commune: "Concepción",
  propertyType: "APARTMENT",
  operation: "SALE",
  totalArea: 80,
  usableArea: 70,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  amenities: ["pool", "heatedPool", "concierge"],
};
const result: OkResult = {
  status: "ok",
  estimate: 120_000_000,
  low: 110_000_000,
  high: 130_000_000,
  pricePerSquareMeter: 1_714_286,
  comparablesCount: 4,
  scope: "portal",
  uf: null,
};

const render = (overrides: { request?: ValuationRequest; quote?: { value: number; date: string } | null } = {}) =>
  renderValuationReport(
    buildReportContent(overrides.request ?? request, result, new Date("2026-10-23T15:00:00Z"), overrides.quote === undefined ? { value: 40_000, date: "2026-10-23" } : overrides.quote),
  );

/** Counts `/Type /Page` objects (not `/Pages`) and reads each page's MediaBox. */
function inspectPdf(buffer: Buffer) {
  const text = buffer.toString("latin1");
  const pages = [...text.matchAll(/\/Type \/Page\b(?!s)/g)].length;
  const sizes = [...text.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map((match) => [Number(match[1]), Number(match[2])]);
  return { text, pages, sizes };
}

describe("renderValuationReport", () => {
  it("produces a Letter PDF of four to six pages", async () => {
    const pdf = await render();
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const { pages, sizes } = inspectPdf(pdf);
    expect(pages).toBeGreaterThanOrEqual(4);
    expect(pages).toBeLessThanOrEqual(6);
    expect(sizes.length).toBeGreaterThan(0);
    for (const [width, height] of sizes) expect([width, height]).toEqual([612, 792]);
  });

  it("renders without UF and without amenities", async () => {
    const pdf = await render({ request: { ...request, amenities: [] }, quote: null });
    expect(pdf.length).toBeGreaterThan(2000);
    expect(inspectPdf(pdf).pages).toBeLessThanOrEqual(6);
  });

  // Run with REPORT_SAMPLE_PATH=<file> to keep a copy of the sample for a visual review.
  it.skipIf(!process.env.REPORT_SAMPLE_PATH)("writes the sample file", async () => {
    const path = process.env.REPORT_SAMPLE_PATH as string;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, await render());
    expect(path).toContain(".pdf");
  });
});

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ValuationResult } from "@portal/shared/valuation";

// No database or network: the estimate and the UF are fixed so the route is tested on its own.
const estimate = vi.hoisted(() => ({ current: null as ValuationResult | null }));
vi.mock("@/services/valuation-service", () => ({ estimateValuation: async () => estimate.current }));
vi.mock("@/lib/uf-value", () => ({ getUfQuote: async () => ({ value: 40_000, date: "2026-10-23" }) }));

const ok: ValuationResult = {
  status: "ok",
  estimate: 120_000_000,
  low: 110_000_000,
  high: 130_000_000,
  pricePerSquareMeter: 1_714_286,
  comparablesCount: 7,
  scope: "commune",
  uf: null,
};

const validRequest = () => ({
  address: "DATOS DE PRUEBA 123",
  commune: "Concepción",
  propertyType: "APARTMENT",
  operation: "SALE",
  totalArea: 80,
  usableArea: 70,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  amenities: ["pool"],
});

async function postReport(body: unknown, rawBody?: string) {
  const { POST } = await import("@/app/api/valuations/report/route");
  return POST(
    new NextRequest("http://localhost:3000/api/valuations/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody ?? JSON.stringify(body),
    }),
  );
}

describe("valuation report API", () => {
  beforeEach(async () => {
    estimate.current = ok;
    (await import("@/lib/http/rate-limit")).resetRateLimits();
  });

  it("answers a PDF attachment", async () => {
    const response = await postReport(validRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("answers 422 when there is not enough data for an estimate", async () => {
    estimate.current = { status: "insufficient" };
    expect((await postReport(validRequest())).status).toBe(422);
  });

  it("rejects invalid data with 400", async () => {
    expect((await postReport({ ...validRequest(), usableArea: 500 })).status).toBe(400);
    expect((await postReport({}, "not json")).status).toBe(400);
  });

  it("limits repeated requests with 429", async () => {
    let last = 0;
    for (let attempt = 0; attempt < 31; attempt += 1) last = (await postReport(validRequest())).status;
    expect(last).toBe(429);
  });
});

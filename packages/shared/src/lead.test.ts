import { describe, expect, it } from "vitest";
import { leadCreateSchema } from "./lead";

const valuation = {
  kind: "VALUATION",
  source: "home-hero",
  name: "María Pérez",
  email: "maria@correo.cl",
  address: "Barros Arana 1000",
  commune: "Concepción",
};

describe("leadCreateSchema", () => {
  it("accepts a valuation request and trims text", () => {
    const parsed = leadCreateSchema.parse({ ...valuation, name: "  María Pérez  ", phone: "" });
    expect(parsed.name).toBe("María Pérez");
    expect(parsed.phone).toBeUndefined();
  });

  it("requires the address for a valuation but not for a search", () => {
    expect(leadCreateSchema.safeParse({ ...valuation, address: " " }).success).toBe(false);
    expect(
      leadCreateSchema.safeParse({ kind: "SEARCH", source: "home-closing", name: "Ana", email: "ana@correo.cl", operation: "RENT" })
        .success,
    ).toBe(true);
  });

  it("accepts the valuation page as a source", () => {
    expect(leadCreateSchema.safeParse({ ...valuation, source: "tasador" }).success).toBe(true);
  });

  it("rejects an invalid email, phone, kind, source and operation", () => {
    expect(leadCreateSchema.safeParse({ ...valuation, email: "nope" }).success).toBe(false);
    expect(leadCreateSchema.safeParse({ ...valuation, phone: "abc" }).success).toBe(false);
    expect(leadCreateSchema.safeParse({ ...valuation, kind: "OTHER" }).success).toBe(false);
    expect(leadCreateSchema.safeParse({ ...valuation, source: "footer" }).success).toBe(false);
    expect(leadCreateSchema.safeParse({ ...valuation, operation: "BUY" }).success).toBe(false);
  });
});

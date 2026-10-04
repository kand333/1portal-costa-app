import { describe, expect, it } from "vitest";
import { featureInputSchema } from "./feature";

describe("featureInputSchema", () => {
  it("trims the name", () => {
    expect(featureInputSchema.parse({ name: "  Vista al mar " })).toEqual({ name: "Vista al mar" });
  });

  it.each([
    [{}, "Ingresa el nombre de la característica"],
    [{ name: " a " }, "Ingresa el nombre de la característica"],
    [{ name: "x".repeat(61) }, "Máximo 60 caracteres"],
  ])("rejects %o", (input, message) => {
    const result = featureInputSchema.safeParse(input);
    expect(result.success ? null : result.error.issues[0].message).toBe(message);
  });
});
